import { requireOptionalNativeModule } from 'expo';

// TARKA's small Android module (android/src/.../TarkaAndroidModule.kt).
// null in jest and on iOS, so callers must handle "not available".

export type TermuxResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  err: number; // -1 = no Termux error
  errmsg: string;
  stdoutOriginalLength: string; // longer than stdout = Termux cut the output
};

type TarkaAndroidModule = {
  hasAllFilesAccess(): boolean;
  openAllFilesAccess(): void;
  documentsPath(): string;
  isTermuxInstalled(): boolean;
  hasTermuxPermission(): boolean;
  requestTermuxPermission(): Promise<{ granted: boolean }>;
  runInTermux(args: string[], stdin: string | null, background: boolean): Promise<TermuxResult>;
};

export const TarkaAndroid = requireOptionalNativeModule<TarkaAndroidModule>('TarkaAndroid');
