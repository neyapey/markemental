
/**
 * Mutable parse state carried across `push` calls.
 *
 * @remarks
 * Holds buffered lines for the currently open block so a pipeline can render
 * complete blocks incrementally while holding back a trailing partial block.
 *
 * @public
 */
export class RendererState {

}
