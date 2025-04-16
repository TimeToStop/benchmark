
export type Action = 'first-render' | 're-render' | 'node-update' | 'node-delete';

export interface INode {
    id: number;
    title: string;
    text: string;
    icon: string;
    final: boolean;
    children: INode[];
}

export interface ITestCase {
    type: Action;
    childrenAmount: number;
    root: INode;
}