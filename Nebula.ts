import {NebulaService} from "./NebulaService";
import {initHttpXhr} from "./HttpXhr";
import {initHttpNode} from "./HttpNode";

// initialize http modules
initHttpXhr();
initHttpNode();

/**
 * @namespace Nebula
 * @description Nebula 名前空間。実体は {@link NebulaService} のデフォルトインスタンスである。
 */
export const Nebula: NebulaService = new NebulaService();
