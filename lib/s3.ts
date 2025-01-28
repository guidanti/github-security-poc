import {
HeadObjectCommand,
HeadObjectCommandInput,
  HeadObjectCommandOutput,
  PutObjectCommand,
  type PutObjectCommandInput,
  type PutObjectCommandOutput,
  S3Client,
  type S3ClientConfig,
  NotFound
} from "npm:@aws-sdk/client-s3@3.701.0";
import {
  call,
  createContext,
  type Operation,
  resource,
} from "npm:effection@4.0.0-alpha.3";

export { type S3ClientConfig } from "npm:@aws-sdk/client-s3@3.701.0";

const S3ClientContext = createContext<S3Client>("s3-client");

function createS3Client(config: S3ClientConfig) {
  return resource<S3Client>(function* (provide) {
    let s3: S3Client | undefined;
    try {
      s3 = new S3Client(config);
      yield* provide(s3);
    } finally {
      s3?.destroy();
    }
  });
}

export function* initS3Client(config: S3ClientConfig) {
  const s3 = yield* createS3Client(config);

  return yield* S3ClientContext.set(s3);
}

export function* useS3Client(): Operation<S3Client> {
  return yield* S3ClientContext.expect();
}

export function* putObject(
  input: PutObjectCommandInput,
): Operation<PutObjectCommandOutput> {
  const s3 = yield* useS3Client();

  return yield* call(() => s3.send(new PutObjectCommand(input)));
}

export function* existsObject(input: HeadObjectCommandInput): Operation<boolean> {
  const s3 = yield* useS3Client();

  try {
    yield* call(() => s3.send(new HeadObjectCommand(input)));
    return true;
  } catch (e) {
    if (e instanceof NotFound) {
      return false;
    } else {
      throw e;
    }
  }
}