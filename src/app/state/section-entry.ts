import { IStateItem } from '../../lib/server/state';

export class SectionEntry implements IStateItem {
  public readonly id: string;

  public sectionId: string;
  public entryId: string;

  constructor(
    id: string,
    sectionId: string,
    entryId: string,
  ) {
    this.id = id;
    this.sectionId = sectionId;
    this.entryId = entryId;
  }
}
