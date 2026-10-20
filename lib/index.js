/**
 * Host half of dsh-markboard.
 *
 * The plugin is pure browser UI: marks live in the browser's own storage, so
 * there is no Host service, Remote, or persisted table to own. This empty
 * `apply` exists so the package can appear as an ordinary Loader entry, which
 * is what makes the browser half discoverable through `dsh.client` in
 * package.json. (`@deepseek-ai/dsh-client-ui-message-feedback` uses the same
 * shape for the same reason.)
 *
 * @module dsh-markboard
 */

/** Host plugin body — no host-side behaviour for this surface plugin. */
export function apply() {}
