import { Component, Input } from '@angular/core';
import { INode } from '../common';

@Component({
  selector: 'app-row',
  templateUrl: './row.component.html',
  styleUrls: ['./row.component.scss']
})
export class RowComponent {
  @Input()
  data: INode | null = null;


}
