// These keys are for fetchers that may affect global state throughout
// the app. For example, the SET_THEME key is used on the /welcome route
// and the account settings route. The fetcher is needed at the root
// of the app to optimistically update the theme settings.

export enum GLOBAL_FETCHER_KEY {
  SET_THEME = "global_set_theme",
}
