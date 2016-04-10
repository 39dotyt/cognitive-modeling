/**
 * @license MIT
 * @author 0@39.yt (Yurij Mikhalevich)
 * @module 'details.component'
 */
import {Component, ElementRef, ViewChild, ChangeDetectorRef} from 'angular2/core';
import {NgFor, NgIf} from 'angular2/common';
import {TranslatePipe} from 'ng2-translate/ng2-translate';
import {Calculator, CalculationResult} from './calculator';
import {ifTriggeredByInputExecuteOnlyIfContentIsValid} from './helpers';

declare const componentHandler: any;

const xlsx: any = require('exceljs');

@Component({
  templateUrl: '/app/details.component.html',
  directives: [NgFor, NgIf],
  pipes: [TranslatePipe]
})
export class Details {
  @ViewChild('mdl') private mdl: ElementRef;
  @ViewChild('input') private input: ElementRef;
  private res: CalculationResult;

  constructor(private calc: Calculator, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    componentHandler.upgradeElements(this.mdl.nativeElement);
    this.recalculate();
  }

  @ifTriggeredByInputExecuteOnlyIfContentIsValid(function() {
    this.res = null;
    this.cdr.detectChanges();
  })
  private recalculate() {
    const steps: number = Number(this.input.nativeElement.value);
    this.res = this.calc.calculate(steps);
    this.cdr.detectChanges();
  }

  private exportDetails() {
    const workbook: any = new xlsx.Workbook();
    workbook.creator = 'Cognitive Modeling';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.addWorksheet('computation details');

    const worksheet = workbook.getWorksheet('computation details');
    worksheet.addRow(['Cognitive modeling']);
    worksheet.addRow([]);
    worksheet.addRow([]);

    worksheet.addRow(['Graph matrix']);
    const hLabels = [''];
    this.res.nodes.forEach(node => hLabels.push(node.label));
    worksheet.addRow(hLabels);
    this.res.matrices[0].forEach((row, i) => {
      const tRow = [this.res.nodes[i].label];
      row.forEach(column => tRow.push(column.toString()));
      worksheet.addRow(tRow);
    });
    worksheet.addRow([]);

    worksheet.addRow(['Impulse vector']);
    const initialVectorRow: any[] = ['Q1='];
    this.res.impulses[0].forEach(column => initialVectorRow.push(column));
    worksheet.addRow(initialVectorRow);
    const row = worksheet.lastRow;
    const newRow: any[] = ['P1='];
    row.eachCell((cell: any, rowNumber: number) => {
      if (rowNumber === 1) return;
      newRow.push({formula: `=${cell.address}`});
    });
    worksheet.addRow(newRow);


    workbook.addWorksheet('matrices');
    const matrices = workbook.getWorksheet('matrices');

    let fmtl: string;
    let fmbr: string;
    let lmtl: string;
    let lmbr: string;

    matrices.addRow(['A']);
    const hLabels2 = [''];
    this.res.nodes.forEach(node => hLabels2.push(node.label));
    matrices.addRow(hLabels2);
    this.res.matrices[0].forEach((row, i) => {
      const tRow = [this.res.nodes[i].label];
      row.forEach(column => tRow.push(column.toString()));
      matrices.addRow(tRow);
      if (i === 0) {
        const rr = matrices.lastRow;
        fmtl = lmtl = rr.getCell(2).address;
      }
      if ((i + 1) === this.res.matrices[0].length) {
        const rr = matrices.lastRow;
        fmbr = lmbr = rr.getCell(row.length + 1).address;
      }
    });
    matrices.addRow([]);

    console.log(fmtl, fmbr, lmtl, lmbr);

    for (let i = 1, l = this.res.matrices.length; i < l; ++i) {
      matrices.addRow([`A^${i + 1}`]);
      matrices.addRow({formula: `'=MMULT(${fmtl}:${fmbr},${lmtl}:${lmbr})`})
    }

    workbook.xlsx.writeFile('/Users/y/test-export.xlsx');
  }
}
