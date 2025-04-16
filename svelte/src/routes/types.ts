export type Action = "first-render" | "re-render" | "node-update" | "node-delete";

export interface INode {
  id: number;
  title: string;
  text: string;
  icon: string;
  final: boolean;
  children: any[];
}

export interface ITestCase {
  type: Action;
  childrenAmount: number;
  root: INode;
}

export interface IStrategy {
  init: () => void;
  measure: (data: INode, setData: (data: INode) => void) => void;
}
