/**
 * @license MIT
 * @author 0@39.yt (Yurij Mikhalevich)
 * @module 'network-drawer-edge-modal'
 */
import {Component} from 'angular2/core';
import {Modal} from './modal';
import {GraphEdgeInfo} from './graph.component';

@Component({
  selector: 'network-drawer-edge-modal',
  templateUrl: 'app/network-drawer-edge-modal.html'
})
export class NetworkDrawerEdgeModal extends Modal {
  private title: string = 'Sample header';
  private edge: GraphEdgeInfo = {label: '', influence: 0};

  showAdd() {
    this.title = 'Add new edge';
    this.edge.label = '';
    this.edge.influence = 0;
    return this.show();
  }

  showEdit(edge: GraphEdgeInfo) {
    this.title = 'Edit edge';
    this.edge.label = edge.label;
    this.edge.influence = edge.influence;
    return this.show();
  }

  private onConfirm(event: Event) {
    event.preventDefault();
    this.edge.influence = Number(this.edge.influence);
    this.close(this.edge);
  }

  private onCancel() {
    this.close(null, true);
  }
}
