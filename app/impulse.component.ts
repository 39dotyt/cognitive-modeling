/**
 * @license MIT
 * @author 0@39.yt (Yurij Mikhalevich)
 * @module 'impulse.component'
 */
import {Component, ElementRef, ViewChild} from 'angular2/core';
import {TranslatePipe} from 'ng2-translate/ng2-translate';
import {Calculator} from './calculator';
import {ifTriggeredByInputExecuteOnlyIfContentIsValid} from './helpers';

/// <reference path="./typings/mdl.d.ts" />
/// <reference path="./typings/vis.d.ts" />
const vis: Vis = require('vis');

@Component({
  templateUrl: '/app/impulse.component.html',
  pipes: [TranslatePipe]
})
export class Impulse {
  @ViewChild('impulse') private impulse: ElementRef;
  @ViewChild('mdl') private mdl: ElementRef;
  @ViewChild('input') private input: ElementRef;
  private graph: any;

  constructor(private calc: Calculator) {}

  ngAfterViewInit() {
    componentHandler.upgradeElements(this.mdl.nativeElement);

    this.graph = new vis.Graph2d(this.impulse.nativeElement, [], {
      legend: true,
      showMajorLabels: false,
      format: {
        minorLabels: {
          millisecond: 'SSS',
          second:      'SSS',
          minute:      'SSS',
          hour:        'SSS',
          weekday:     'SSS',
          day:         'SSS',
          month:       'SSS',
          year:        'SSS'
        }
      }
    });

    this.updateVisualisation();
  }

  @ifTriggeredByInputExecuteOnlyIfContentIsValid(function() {
    this.graph.setItems([]);
  })
  private updateVisualisation() {
    const steps: number = Number(this.input.nativeElement.value);
    const res = this.calc.calculate(steps);
    if (!res) return;
    const items: Graph2dItem[] = [];
    res.values.forEach((step, x) => {
      step.forEach((y, group) => {
        items.push({x, y, group});
      });
    });
    this.graph.setItems(items);
    const groups: Graph2dGroup[] = [];
    for (let id = 0, l = res.nodes.length; id < l; ++id) {
      groups.push({id, content: res.nodes[id].label});
    }
    this.graph.setGroups(groups);
    this.graph.fit();
  }
}
