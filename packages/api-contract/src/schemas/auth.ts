// ルートの @turf-notes/domain を引くと schemas のバレルが no-barrel-file の上限を超えるため、auth だけを読む。
export {
  authMethodsSchema,
  canSetPasswordSignIn,
  userSchema,
} from "@turf-notes/domain/auth";
export type { AuthMethods, User } from "@turf-notes/domain/auth";
