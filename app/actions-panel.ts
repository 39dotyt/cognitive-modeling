/**
 * @license MIT
 * @author 0@39.yt (Yurij Mikhalevich)
 * @module 'actions-panel'
 */
import {Injectable} from 'angular2/core';
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

  private pendingChanges_: boolean;
  private set pendingChanges(changes: boolean) {
    this.pendingChanges_ = changes;
    currentWindow.setTitle(`${changes ? '*' : ''}${this.fileName || ''} Cognitive Modeling`);
  }
  private get pendingChanges() {
    return this.pendingChanges_;
  }

  private fileTypeFilters: Object[] = [
    {name: 'Cognitive Modeling Graphs', extensions: ['cgg']}
  ];

  private dataUpdateSubscription: any;

  constructor(private storage: GraphDataStorage) {
    this.create();
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
        title: 'Save graph file',
        filters: this.fileTypeFilters
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
      title: 'Load existing graph file',
      filters: this.fileTypeFilters,
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
    if (this.pendingChanges) {
      const shouldSave = dialog.showMessageBox(currentWindow, {
        type: 'question',
        buttons: ['No', 'Yes'],
        defaultId: 1,
        title: 'Do you want to save current graph?',
        message:
          `You have unsaved changes in your current graph.\n
          Do you want to save them?\n
          If you will select "No" you will lost all of your unsaved changes.`
      });
      if (shouldSave) {
        this.save();
      }
    }
  }

  quit() {
    this.saveIfShould();
    app.quit();
  }
}
