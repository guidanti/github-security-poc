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
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

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
  cardSummary: {
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(10),
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  formControl: {
    width: theme.spacing(23),
  },
  summaryValue: {
    fontWeight: 'bold',
    overflow: 'hidden',
    lineHeight: '24px',
    wordBreak: 'break-word',
  },
  summaryLabel: {
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
}));

export const EntitySecurityCard = () => {
  const scm = useApi(scmAuthApiRef);
  const config = useApi(configApiRef);
  const discovery = useApi(discoveryApiRef);

  const { entity } = useEntity();
  const classes = useStyles();

  const [commit, setCommit] = useState('');

  const ownerWithName =
    entity &&
    entity.metadata &&
    entity.metadata.annotations &&
    entity.metadata.annotations['github.com/project-slug'];

  const allShas = useAsync(async () => {
    if (ownerWithName) {
      const [org, repo] = ownerWithName.split('/');

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
      } = (await shas.json()) as {
        data: { cube: { sarifs: { github_sha: string } }[] };
      };
      return cube.map(sha => sha.sarifs.github_sha);
    }
    return [];
  }, [ownerWithName]);

  const repoCommits = useAsync(async () => {
    if (ownerWithName) {
      const [org, repo] = ownerWithName.split('/');

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
      setCommit(repoCommits.data[0].sha);
      return repoCommits.data.map(commit => commit.sha);
    }
    return [];
  }, [ownerWithName]);

  const sarifs = useAsync(async () => {
    if (ownerWithName && commit) {
      const [org, repo] = ownerWithName.split('/');
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

      const levels = JSON.parse(results)
        .map((result: SarifResult) => result.level)
        .reduce((acc: { [key: string]: number }[], level: string) => {
          const existingItem = acc.find(item => item[level] !== undefined);
          if (existingItem) {
            existingItem[level] += 1;
          } else {
            acc.push({ [level]: 1 });
          }
          return acc;
        }, [] as { [key: string]: number }[]);

      return {
        github_sha,
        tool_name,
        results: JSON.parse(results),
        levels,
      };
    }
    return;
  }, [commit, ownerWithName]);

  const error = allShas.error || repoCommits.error;
  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  if (allShas.loading || repoCommits.loading) {
    return <Progress />;
  }

  return (
    <Card className={classes.gridItemCard}>
      <CardHeader title={'Security'} className={classes.cardHeader} />
      <Divider />
      <CardContent className={classes.cardSummary}>
        <FormControl variant="outlined" className={classes.formControl}>
          <InputLabel>Commits</InputLabel>
          <Select
            value={commit}
            onChange={e => setCommit(`${e.target.value}`)}
            label="Commits"
          >
            {(repoCommits.value ?? []).map((commit, index) => {
              return (
                <MenuItem
                  key={commit}
                  value={commit}
                  disabled={!(allShas.value ?? []).includes(commit)}
                >
                  {commit.substring(0, 7)}
                  {index === 0 && ' (latest)'}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        { commit && sarifs.value ? sarifs.value.levels.map((level: { [key: string]: number }) => {
          const [label, count] = Object.entries(level)[0];
          return <AboutField label={label} value={`${count}`} />
        }) : null}
      </CardContent>
      <CardContent className={classes.cardContent}>
        {commit && sarifs.value ? (
          <SecurityReportTable results={sarifs.value.results} />
        ) : null}
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

export interface AboutFieldProps {
  label: string;
  value?: string;
  gridSizes?: Record<string, number>;
  className?: string;
}

function AboutField(props: AboutFieldProps) {
  const { label, value, gridSizes, className } = props;
  const classes = useStyles();

  return (
    <Grid item {...gridSizes} className={className}>
      <Typography variant="h2" className={classes.summaryLabel}>
        {label}
      </Typography>
      <Typography variant="body2" className={classes.summaryValue}>
        {value || `unknown`}
      </Typography>
    </Grid>
  );
}
