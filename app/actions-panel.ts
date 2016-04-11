/**
 * @license MIT
 * @author 0@39.yt (Yurij Mikhalevich)
 * @module 'actions-panel'
 */
import {Injectable} from 'angular2/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {GraphDataStorage} from './graph.component';

const fs = require('fs');
const path = require('path');
const remote = require('electron').remote;

const dialog = remote.dialog;
const currentWindow = remote.getCurrentWindow();
const app = remote.app;

@Injectable()
export class ActionsPanel {
  private filePath_: string;
  private fileName: string;
  private pendingChanges_: boolean;
  private dataUpdateSubscription: any;

  constructor(private storage: GraphDataStorage, private translate: TranslateService) {
    this.create();
  }

  private getFileTypeFilters(): Object[] {
    return [{
      name: this.translate.instant('PANEL.CMG-DESCRIPTION'),
      extensions: ['cmg']
    }];
  }

  private setFilePath(newPath: string) {
    this.filePath_ = newPath;
    if (!newPath) {
      this.fileName = null;
    } else {
      this.fileName = path.basename(this.filePath_);
    }
  }

  private getFilePath() {
    return this.filePath_;
  }

  private set pendingChanges(changes: boolean) {
    this.pendingChanges_ = changes;
    currentWindow.setTitle(`${changes ? '*' : ''}${this.fileName || ''} Cognitive Modeling`);
  }

  private get pendingChanges() {
    return this.pendingChanges_;
  }

  ngOnDestroy() {
    if (this.dataUpdateSubscription) {
      this.dataUpdateSubscription.unsubscribe();
      this.dataUpdateSubscription = null;
    }
  }

  create() {
    if (this.dataUpdateSubscription) this.dataUpdateSubscription.unsubscribe();

    this.saveIfShould();
    this.storage.updateData({nodes: [], edges: []});
    this.setFilePath(null);
    this.pendingChanges = false;

    this.dataUpdateSubscription =
      this.storage.dataUpdated.subscribe(() => this.pendingChanges = true);
  }

  save(askFilePath: boolean = false) {
    if (!askFilePath && !this.pendingChanges) return;
    if (askFilePath || !this.getFilePath()) {
      this.setFilePath(dialog.showSaveDialog(currentWindow, {
        title: this.translate.instant('PANEL.SAVE-DIALOG-TITLE'),
        filters: this.getFileTypeFilters()
      }));
      if (!this.getFilePath()) return;
    }
    const toSave = this.storage.getData();
    fs.writeFileSync(this.getFilePath(), JSON.stringify(toSave, null, 2));
    this.pendingChanges = false;
  }

  load() {
    if (this.dataUpdateSubscription) this.dataUpdateSubscription.unsubscribe();

    const filePath = dialog.showOpenDialog(currentWindow, {
      title: this.translate.instant('PANEL.LOAD-DIALOG-TITLE'),
      filters: this.getFileTypeFilters(),
      properties: ['openFile']
    });
    if (!filePath) return;
    this.setFilePath(filePath[0]);
    this.storage.updateData(
      JSON.parse(fs.readFileSync(this.getFilePath()).toString()));
    this.pendingChanges = false;

    this.dataUpdateSubscription =
      this.storage.dataUpdated.subscribe(() => this.pendingChanges = true);
  }

  private saveIfShould() {
    if (!this.pendingChanges) return;
    const shouldSave = dialog.showMessageBox(currentWindow, {
      type: 'question',
      buttons: [
        this.translate.instant('MESSAGE-BOX.NO'),
        this.translate.instant('MESSAGE-BOX.YES')
      ],
      defaultId: 1,
      title: this.translate.instant('PANEL.SAVE-CONFIRMATION-DIALOG-TITLE'),
      message: this.translate.instant('PANEL.SAVE-CONFIRMATION-DIALOG-MESSAGE')
    });
    if (shouldSave) {
      this.save();
    }
  }

  quit() {
    this.saveIfShould();
    app.quit();
  }
}
