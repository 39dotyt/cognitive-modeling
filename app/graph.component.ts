/**
 * @license MIT
 * @author 0@39.yt (Yurij Mikhalevich)
 * @module 'network-drawer.component'
 */
import {Component, ElementRef, ViewChild, Output, EventEmitter, Injectable} from 'angular2/core';
import {NetworkDrawerNodeModal} from './network-drawer-node-modal';
import {NetworkDrawerEdgeModal} from './network-drawer-edge-modal';
import {TranslateService} from 'ng2-translate/ng2-translate';

/// <reference path="./typings/vis.d.ts" />
const vis: Vis = require('vis');

export interface GraphNodeInfo {
  label: string,
  value: number,
  impulse: number
}

interface GraphNodeInternal extends NetworkNode {
  info: GraphNodeInfo
}

export interface GraphEdgeInfo {
  label: string,
  influence: number
}

interface GraphEdgeInternal extends NetworkEdge {
  label: string,
  info: GraphEdgeInfo
}

export interface GraphNode extends NetworkNode {
  impulse: number,
  value: number
}

export interface GraphEdge extends NetworkEdge {
  label: string,
  influence: number
}

interface GraphDataInternal {
  nodes: DataSet<GraphNodeInternal>,
  edges: DataSet<GraphEdgeInternal>
}

export interface GraphData {
  nodes: GraphNode[],
  edges: GraphEdge[]
}

@Injectable()
export class GraphDataStorage {
  @Output() dataUpdated = new EventEmitter();

  private data_: GraphData;
  private rawData_: GraphDataInternal;

  getData(): GraphData {
    if (!this.data_) {
      this.data_ = GraphDataStorage.MarshalData(this.rawData_);
    }
    return this.data_;
  }

  getRawData(): GraphDataInternal {
    if (!this.rawData_) {
      this.rawData_ = GraphDataStorage.UnmarshalData(this.data_);
    }
    return this.rawData_;
  }

  updateData(data: GraphData): void {
    this.data_ = data;
    this.rawData_ = undefined;
    this.dataUpdated.emit(null);
  }

  updateRawData(rawData: GraphDataInternal): void {
    this.rawData_ = rawData;
    this.data_ = undefined;
    this.dataUpdated.emit(null);
  }

  private static MarshalData(data: GraphDataInternal): GraphData {
    return {
      nodes: data.nodes.map((node: GraphNodeInternal) => {
        return Object.assign({id: node.id}, node.info);
      }),
      edges: data.edges.map((edge: GraphEdgeInternal) => {
        return Object.assign({
          from: edge.from,
          to: edge.to
        }, edge.info);
      })
    };
  }

  private static UnmarshalData(data: GraphData): GraphDataInternal {
    return {
      nodes: new vis.DataSet(data.nodes.map((node: GraphNode) => {
        return {
          id: node.id,
          label: `${node.label} (${node.value}, ${node.impulse})`,
          info: {
            label: node.label,
            value: node.value,
            impulse: node.impulse
          }
        };
      })),
      edges: new vis.DataSet(data.edges.map((edge: GraphEdge) => {
        return {
          from: edge.from,
          to: edge.to,
          label: `${edge.label} (${edge.influence})`,
          info: {
            label: edge.label,
            influence: edge.influence
          }
        };
      }))
    };
  }
}

@Component({
  templateUrl: '/app/graph.component.html',
  directives: [NetworkDrawerNodeModal, NetworkDrawerEdgeModal]
})
export class Graph {
  @ViewChild('graph') private graphNode: ElementRef;
  @ViewChild(NetworkDrawerNodeModal) private nodeModal: NetworkDrawerNodeModal;
  @ViewChild(NetworkDrawerEdgeModal) private edgeModal: NetworkDrawerEdgeModal;
  private network: Network;
  private data: GraphDataInternal;

  private dataUpdatedSubscription: any;
  private languageChangeSubscription: any;

  constructor(private storage: GraphDataStorage, private translate: TranslateService) {}

  ngOnDestroy() {
    if (this.dataUpdatedSubscription) {
      this.dataUpdatedSubscription.unsubscribe();
      this.dataUpdatedSubscription = null;
    }
    if (this.languageChangeSubscription) {
      this.languageChangeSubscription.unsubscribe();
      this.languageChangeSubscription = null;
    }
  }

  ngAfterViewInit() {
    const options = {
      layout: {randomSeed: 3}, // just to make sure the layout is the same when the locale is changed
      locale: this.translate.currentLang,
      edges: {
        arrows: 'middle',
        font: {align: 'top'}
      },
      locales: {
        ru: {
          edit: 'Редактировать',
          del: 'Удалить выбранное',
          back: 'Назад',
          addNode: 'Добавить узел',
          addEdge: 'Добавить связь',
          editNode: 'Редактировать узел',
          editEdge: 'Редактировать связь',
          addDescription: 'Кликните в свободное пространство для того, чтобы добавить узел.',
          edgeDescription: 'Кликните на узел и перетащите связь к другому узлу для того, чтобы соединить их.',
          editEdgeDescription: 'Кликните на контрольные точки и перетащите их к другим узлам для того, чтобы соединить их.',
          createEdgeError: 'Нельзя связывать узлы в кластер.',
          deleteClusterError: 'Кластер не может быть удалён.',
          editClusterError: 'Кластер нельзя редактировать.'
        },
        // en copied from vis sources
        en: {
          edit: 'Edit',
          del: 'Delete selected',
          back: 'Back',
          addNode: 'Add Node',
          addEdge: 'Add Edge',
          editNode: 'Edit Node',
          editEdge: 'Edit Edge',
          addDescription: 'Click in an empty space to place a new node.',
          edgeDescription: 'Click on a node and drag the edge to another node to connect them.',
          editEdgeDescription: 'Click on the control points and drag them to a node to connect to it.',
          createEdgeError: 'Cannot link edges to a cluster.',
          deleteClusterError: 'Clusters cannot be deleted.',
          editClusterError: 'Clusters cannot be edited.'
        }
      },
      manipulation: {
        addNode: (data: GraphNodeInternal, callback: Function) => {
          this.nodeModal.showAdd().then((newNode: GraphNodeInfo) => {
            data.info = Object.assign({}, newNode);
            data.label = `${data.info.label} (${data.info.value}, ${data.info.impulse})`;
            callback(data);
          });
        },
        editNode: (data: GraphNodeInternal, callback: Function) => {
          this.nodeModal.showEdit(data.info).then((editNode: GraphNodeInfo) => {
            data.info = Object.assign({}, editNode);
            data.label = `${data.info.label} (${data.info.value}, ${data.info.impulse})`;
            callback(data);
          }).catch(() => {
            callback(data);
          });
        },
        addEdge: (data: GraphEdgeInternal, callback: Function) => {
          if (data.from === data.to) {
            alert(this.translate.instant("GRAPH.FORBIDDEN-NODE-TO-ITSELF"));
            return;
          }
          const edges: GraphEdgeInternal[] = this.data.edges.get();
          for (let i = 0, l = edges.length; i < l; ++i) {
            const edge = edges[i];
            if (edge.from === data.from && edge.to === data.to ||
              edge.from === data.to && edge.to === data.from)
            {
              alert(this.translate.instant("GRAPH.FORBIDDEN-TWO-IMPULSES-BETWEEN-TWO-NODES"));
              return;
            }
          }
          this.edgeModal.showAdd().then((newEdge: GraphEdgeInfo) => {
            data.info = Object.assign({}, newEdge);
            data.label = `${newEdge.label} (${newEdge.influence})`;
            callback(data);
          }).catch(() => {});
        }
      }
    };

    this.network = new vis.Network(this.graphNode.nativeElement);
    this.network.setOptions(options);

    this.loadDataFromStorage();

    this.network.on('doubleClick', (data: {edges: NetworkNodeId[]}) => {
      if (data.edges.length === 1) {
        const edge = <GraphEdgeInternal> this.data.edges.get(data.edges[0]);
        this.edgeModal.showEdit(edge.info).then((editEdge: GraphEdgeInfo) => {
          edge.info = editEdge;
          edge.label = `${editEdge.label} (${editEdge.influence})`;
          this.data.edges.update(edge);
        });
      }
    });

    this.languageChangeSubscription =
      this.translate.onLangChange.subscribe((lang: {lang: string}) => {
        this.network.setOptions({locale: lang.lang});
        // this will force translation to apply immediately
        this.network.disableEditMode();
      });
  }

  private loadDataFromStorage(): void {
    if (this.dataUpdatedSubscription) this.dataUpdatedSubscription.unsubscribe();

    this.data = this.storage.getRawData();
    this.network.setData(this.data);

    this.dataUpdatedSubscription = this.storage.dataUpdated.subscribe(
      this.loadDataFromStorage.bind(this));

    this.data.nodes.on('*', this.onGraphChange.bind(this));
    this.data.edges.on('*', this.onGraphChange.bind(this));
  }

  private onGraphChange(): void {
    if (this.dataUpdatedSubscription) this.dataUpdatedSubscription.unsubscribe();

    this.storage.updateRawData(this.data);

    this.dataUpdatedSubscription = this.storage.dataUpdated.subscribe(
      this.loadDataFromStorage.bind(this));
  }
}
