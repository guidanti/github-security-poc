import { call } from "npm:effection@4.0.0-alpha.3";
import { stringify } from "npm:yaml@2.6.1";
import { ClonedPath } from "./repos-clone.ts";
import { useCache } from "fetcher-lib/useCache.ts";
import { remove, mkdir, write, exists } from './fs.ts';

export function* generateEntities(repositories: ClonedPath[]) {
  const cache = yield* useCache();
  yield* clearCatalogInfoFiles();
  for (const repository of repositories) {
    const entity = createCatalogInfo(repository);
    const file = new URL(`./catalog/${repository.name}.yaml`, cache.location);
    yield* call(() => write(file, new TextEncoder().encode(stringify(entity))));
  }
}

function createCatalogInfo(repository: ClonedPath) {
  return {
    apiVersion: "backstage.io/v1alpha1",
    kind: "Component",
    metadata: {
      name: repository.name.replace(/\ /g, '-').replace(/[^a-zA-Z0-9_\-\.]/g, ''),
      annotations: {
        "github.com/project-slug": repository.nameWithOwner,
      },
    },
    spec: {
      type: "service",
      lifecycle: "production",
      owner: "bcgov",
    }
  }
}

function* clearCatalogInfoFiles() {
  const cache = yield* useCache();
  const catalogDir = new URL("./catalog/", cache.location);
  yield* call(() => remove(catalogDir, { recursive: true }));
  yield* call(() => mkdir(catalogDir, { recursive: true }));
}
