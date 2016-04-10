/**
 * @license MIT
 * @author 0@39.yt (Yurij Mikhalevich)
 * @module 'network-drawer-node-modal'
 */
import {Component} from 'angular2/core';
import {Modal} from './modal';
import {GraphNodeInfo} from './graph.component';

@Component({
  selector: 'network-drawer-node-modal',
  templateUrl: '/app/network-drawer-node-modal.html'
})
export class NetworkDrawerNodeModal extends Modal {
  private title: string = 'Sample header';
  private node: GraphNodeInfo = {label: '', value: 0, impulse: 0};

  showAdd() {
    this.title = 'Add new node';
    this.node.label = '';
    this.node.value = 0;
    this.node.impulse = 0;
    return this.show();
  }

  showEdit(node: GraphNodeInfo) {
    this.title = 'Edit node';
    this.node.label = node.label;
    this.node.value = node.value;
    this.node.impulse = node.impulse;
    return this.show();
  }

  private onConfirm(event: Event) {
    event.preventDefault();
    this.node.value = Number(this.node.value);
    this.node.impulse = Number(this.node.impulse);
    this.close(this.node);
  }

  private onCancel() {
    this.close(null, true);
  }
}
