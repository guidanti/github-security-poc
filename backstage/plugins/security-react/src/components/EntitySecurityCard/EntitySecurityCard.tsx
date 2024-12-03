import React, { useState } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import useAsync from 'react-use/lib/useAsync';
import { Progress, ResponseErrorPanel } from '@backstage/core-components';

import { useApi } from '@backstage/frontend-plugin-api';
import { scmAuthApiRef } from '@backstage/integration-react';
import { configApiRef, discoveryApiRef } from '@backstage/core-plugin-api';
import { readGithubIntegrationConfigs } from '@backstage/integration';
import { Octokit } from '@octokit/rest';
import { fetch } from 'cross-fetch';

import { makeStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Divider from '@material-ui/core/Divider';

import { SecurityReportTable, type SarifResult } from '../SecurityReportTable';

const useStyles = makeStyles(theme => ({
  gridItemCard: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '10px',
  },
  cardHeader: {
    paddingBottom: theme.spacing(1),
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  formControl: {
    width: theme.spacing(23),
    marginBottom: theme.spacing(2),
  },
}));

export const EntitySecurityCard = () => {
  const scm = useApi(scmAuthApiRef);
  const config = useApi(configApiRef);
  const discovery = useApi(discoveryApiRef);

  const { entity } = useEntity();
  const classes = useStyles();

  const [commits, setCommits] = useState([] as string[]);
  const [commit, setCommit] = useState('');
  const [allShas, setAllShas] = useState([] as string[]);
  const [sarif, setSarif] = useState(
    {} as {
      github_sha: string;
      tool_name: string;
      results: SarifResult[];
    },
  );

  const { loading, error } = useAsync(async () => {
    if (
      entity &&
      entity.metadata &&
      entity.metadata.annotations &&
      entity.metadata.annotations['github.com/project-slug']
    ) {
      const [org, repo] =
        entity.metadata.annotations['github.com/project-slug'].split('/');

      const proxyUrl = await discovery.getBaseUrl('proxy');
      const shas = await fetch(`${proxyUrl}/cube`, {
        method: 'POST',
        body: JSON.stringify({
          query: SHA_QUERY,
          variables: {
            owner: org,
            repository: repo,
          },
        }),
      });
      const {
        data: { cube },
      } = await shas.json();
      setAllShas(
        cube.map(
          (sha: { sarifs: { github_sha: string } }) => sha.sarifs.github_sha,
        ),
      );

      const { token } = await scm.getCredentials({
        url: `https://github.com/${org}/${repo}`,
        additionalScope: {
          customScopes: {
            github: ['repo'],
          },
        },
      });
      const configs = readGithubIntegrationConfigs(
        config.getOptionalConfigArray('integrations.github') ?? [],
      );
      const githubIntegrationConfig = configs.find(
        v => v.host === 'github.com',
      );
      const octokit = new Octokit({
        auth: token,
        baseUrl: githubIntegrationConfig?.apiBaseUrl,
      });
      const repoCommits = await octokit.request(
        'GET /repos/{owner}/{repo}/commits',
        {
          owner: org,
          repo,
          per_page: 7,
        },
      );
      setCommits(repoCommits.data.map(commit => commit.sha.substring(0, 7)));
    }
  }, []);

  const { loading: _loadingSarif, error: _errorSarif } = useAsync(async () => {
    if (
      entity &&
      entity.metadata &&
      entity.metadata.annotations &&
      entity.metadata.annotations['github.com/project-slug'] &&
      commit
    ) {
      const [org, repo] =
        entity.metadata.annotations['github.com/project-slug'].split('/');
      const proxyUrl = await discovery.getBaseUrl('proxy');
      const sarifs = await fetch(`${proxyUrl}/cube`, {
        method: 'POST',
        body: JSON.stringify({
          query: SARIF_QUERY,
          variables: {
            owner: org,
            repository: repo,
            commit,
          },
        }),
      });
      const {
        data: {
          cube: [
            {
              sarifs: { github_sha, tool_name, results },
            },
          ],
        },
      } = await sarifs.json();
      setSarif({
        github_sha,
        tool_name,
        results: JSON.parse(results),
      });
    }
  }, [commit]);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return (
    <Card className={classes.gridItemCard}>
      <CardHeader title={'Security'} className={classes.cardHeader} />
      <Divider />
      <CardContent className={classes.cardContent}>
        <FormControl variant="outlined" className={classes.formControl}>
          <InputLabel>Commits</InputLabel>
          <Select
            value={commit}
            onChange={e => setCommit(`${e.target.value}`)}
            label="Commits"
          >
            {commits.map((commit, index) => {
              return (
                <MenuItem
                  key={commit}
                  value={commit}
                  disabled={!allShas.includes(commit)}
                >
                  {commit}
                  {index === 0 && ' (latest)'}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        {commit && sarif.results ? (
          <SecurityReportTable results={sarif.results} />
        ) : (
          ''
        )}
      </CardContent>
    </Card>
  );
};

const SARIF_QUERY = `
  query SarifQuery($owner: String!, $repository: String!, $commit: String!) {
    cube(where: {
      sarifs: {
        github_owner: { equals: $owner },
        github_repository: { equals: $repository },
        github_sha: { equals: $commit },
      }
    }) {
      sarifs {
        github_sha
        tool_name
        results
      }
    }
  }
`;

const SHA_QUERY = `
  query ShaQuery($owner: String!, $repository: String!) {
    cube(where: { sarifs: {
      github_owner: { equals: $owner },
      github_repository: { equals: $repository },
    }}) {
      sarifs {
        github_sha
      }
    }
  }
`;
