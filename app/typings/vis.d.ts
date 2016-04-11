// for some reasons cannot be referenced with import
//import {ElementRef} from '../node_modules/angular2/core.d.ts';

interface DataSetConstructor {
  new<T> (data: T[]): DataSet<T>;
}

interface DataSet<T> extends Array<T> {
  on(event: string, callback: Function): void;
  update(item: T): void;
  get(id: NetworkNodeId): T;
  get(): T[];
}

type NetworkNodeId = string|number;

interface NetworkNode {
  id: NetworkNodeId,
  label: string
}

interface NetworkEdge {
  from: NetworkNodeId,
  to: NetworkNodeId,
  label?: string
}

interface NetworkData {
  nodes: DataSet<NetworkNode>|NetworkNode[],
  edges: DataSet<NetworkEdge>|NetworkEdge[]
}

interface NetworkConstructor {
  new (container: Node /*ElementRef*/, data?: NetworkData, options?: {}): Network;
}

interface Network {
  setData(data: NetworkData): void;
  setOptions(opts: Object): void;
  on(event: string, callback: Function): void;
  addEdgeMode(): void;
  addNodeMode(): void;
  editEdgeMode(): void;
  editNodeMode(): void;
  disableEditMode(): void;
  enableEditMode(): void;
  editNode(): void;
  body: {
    data: {
      edges: DataSet<NetworkEdge>,
      nodes: DataSet<NetworkNode>
    }
  }
}

type Graph2dItem = {
  x: number,
  y: number,
  group: number
}

type Graph2dGroup = {
  id: number,
  content: string
}

interface Graph2dConstructor {
  new (container: Node /*ElementRef*/, items?: Graph2dItem[], options?: {}): Graph2d;
}

interface Graph2d {
  setOptions(opts: Object): void;
  setItems(items: Graph2dItem[]): void;
  setGroups(groups: Graph2dGroup[]): void;
  fit(): void;
}

interface Vis {
  DataSet: DataSetConstructor,
  Network: NetworkConstructor,
  Graph2d: Graph2dConstructor
}
