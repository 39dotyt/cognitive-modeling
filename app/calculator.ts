/**
 * @license MIT
 * @author 0@39.yt (Yurij Mikhalevich)
 * @module calculator
 */
import {Injectable} from 'angular2/core';
import {GraphData, GraphDataStorage, GraphNode, GraphEdge} from './graph.component';

const math: any = require('mathjs');

export interface CalculationResult {
  values: number[][],
  impulses: number[][],
  matrices: number[][][],
  nodes: GraphNode[]
}

@Injectable()
export class Calculator {
  private values: number[][];
  private impulses: number[][];
  private matrices: number[][][];
  private maxSteps: number;
  private graphData: GraphData;

  constructor(private storage: GraphDataStorage) {
    this.storage.dataUpdated.subscribe(() => {
      this.values = undefined;
      this.impulses = undefined;
      this.matrices = undefined;
      this.maxSteps = 0;
      this.graphData = undefined;
    });
  }

  calculate(steps: number): CalculationResult {
    if (!this.graphData) this.performInitialCalculation();
    if (this.graphData.nodes.length === 0) return;

    for (let i = this.maxSteps; i < steps; ++i) {
      const res: number[] = [];
      const impulsesPrev = this.impulses[i - 1];
      for (let j = 0; j < impulsesPrev.length; ++j) {
        res[j] = this.values[i - 1][j] + impulsesPrev[j];
      }
      this.values.push(res);
      const matrixPrev = this.matrices[i - 1];
      this.impulses.push(math.multiply(this.impulses[0], matrixPrev));
      this.matrices.push(math.multiply(this.matrices[0], matrixPrev));
    }
    this.maxSteps = Math.max(this.maxSteps, steps);
    return {
      values: this.values.slice(0, steps),
      impulses: this.impulses.slice(0, steps),
      matrices: this.matrices.slice(0, steps),
      nodes: this.graphData.nodes
    };
  }

  performInitialCalculation(): void {
    this.graphData = this.storage.getData();
    console.log('edges', this.graphData.edges);
    console.log('nodes', this.graphData.nodes);
    this.values = [[]];
    this.impulses = [[]];
    const idToIndexMap: {[id: string]: number} = {};
    this.graphData.nodes.forEach((node: GraphNode, index: number) => {
      idToIndexMap[node.id] = index;
      this.impulses[0][index] = node.impulse;
      this.values[0][index] = node.value;
    });
    console.log('impulses', this.impulses);
    this.matrices = [];
    const matrix: number[][] = [];
    const n: number = this.graphData.nodes.length;
    for (let i = 0; i < n; ++i) {
      matrix.push([]);
      for (let j = 0; j < n; ++j) {
        matrix[i].push(0);
      }
    }
    this.graphData.edges.forEach((edge: GraphEdge) => {
      const from = idToIndexMap[edge.from];
      const to = idToIndexMap[edge.to];
      matrix[from][to] = edge.influence;
    });
    this.matrices.push(matrix);
    this.maxSteps = 1;
  }
}
