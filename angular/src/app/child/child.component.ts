import { Component, Input } from '@angular/core';
import { INode } from '../common';

@Component({
  selector: 'app-child',
  templateUrl: './child.component.html',
  styleUrls: ['./child.component.scss']
})
export class ChildComponent {

  @Input()
  data: INode | null = null;


  id(index: number, item: INode) {
    return item.id;
  }
}
