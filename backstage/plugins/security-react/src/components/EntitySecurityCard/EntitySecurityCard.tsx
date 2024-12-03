import React from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import useAsync from 'react-use/lib/useAsync';
import { Progress, ResponseErrorPanel } from '@backstage/core-components';

import { useApi } from '@backstage/frontend-plugin-api';
import { scmAuthApiRef } from '@backstage/integration-react';
import { configApiRef } from '@backstage/core-plugin-api';
import { readGithubIntegrationConfigs } from '@backstage/integration';
import { Octokit } from '@octokit/rest';

export const EntitySecurityCard = () => {
  const { entity } = useEntity();
  const scm = useApi(scmAuthApiRef);
  const config = useApi(configApiRef);

  const {
    value: commits,
    loading,
    error,
  } = useAsync(async () => {
    if (
      entity &&
      entity.metadata &&
      entity.metadata.annotations &&
      entity.metadata.annotations['github.com/project-slug']
    ) {
      const [ org, repo ] = entity.metadata.annotations['github.com/project-slug'].split('/');
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
      const githubIntegrationConfig = configs.find(v => v.host === "github.com");
      const octokit = new Octokit({
        auth: token,
        baseUrl: githubIntegrationConfig?.apiBaseUrl
      });
      const results = await octokit.request(
        'GET /repos/{owner}/{repo}/commits',
        {
          owner: org,
          repo,
          per_page: 5,
        }
      );
      const commits = results.data.map(commit => commit.sha.substring(0, 9));
      return commits;
    } else {
      return null;
    }
  }, []);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return <>{JSON.stringify(commits, null , 2)}</>;
};
