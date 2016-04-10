/**
 * @license MIT
 * @author 0@39.yt (Yurij Mikhalevich)
 * @module modal
 */
import {ElementRef, ViewChild} from 'angular2/core';

interface MDL {
  upgradeElements(domNode: Node): void;
}

declare const componentHandler: MDL;

export class Modal {
  @ViewChild('dialog') private dialog: ElementRef;
  private resolve: Function;
  private reject: Function;

  ngAfterViewInit() {
    componentHandler.upgradeElements(this.dialog.nativeElement);
  }

  show() {
    return new Promise((resolve: Function, reject: Function) => {
      this.resolve = resolve;
      this.reject = reject;
      //noinspection TypeScriptUnresolvedFunction
      this.dialog.nativeElement.showModal();
      componentHandler.upgradeElements(this.dialog.nativeElement);
    });
  }

  close(data: any, reject: boolean = false) {
    if (!this.resolve || !this.reject) return;
    this.dialog.nativeElement.close();
    if (reject) {
      this.reject(data)
    } else {
      this.resolve(data);
    }
    this.reject = this.resolve = undefined;
  }
}
