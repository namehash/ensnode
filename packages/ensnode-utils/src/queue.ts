export interface IPriorityQueue<T> {
  push(item: T): void;
  peek(): T | undefined;
  pop(): T | undefined;
  size(): number;
  isEmpty(): boolean;
}

export class PriorityQueue<Priority extends number, Value>
  implements IPriorityQueue<[Priority, Value]>
{
  private heap: Array<[Priority, Value]> = [];

  constructor(private readonly compare: (a: [Priority, Value], b: [Priority, Value]) => number) {}

  push(item: [Priority, Value]): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  peek(): [Priority, Value] | undefined {
    return this.heap[0];
  }

  pop(): [Priority, Value] | undefined {
    if (this.isEmpty()) return undefined;

    const result = this.heap[0];
    const last = this.heap.pop();

    if (this.heap.length > 0 && last) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }

    return result;
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];
      const current = this.heap[index];

      if (!parent || !current) break;
      if (this.compare(parent, current) <= 0) break;

      this.heap[parentIndex] = current;
      this.heap[index] = parent;
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      let smallest = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      const current = this.heap[smallest];
      const left = this.heap[leftChild];
      const right = this.heap[rightChild];

      if (!current) break;

      if (left && leftChild < this.heap.length && this.compare(left, current) < 0) {
        smallest = leftChild;
      }

      if (right && rightChild < this.heap.length && this.compare(right, this.heap[smallest]!) < 0) {
        smallest = rightChild;
      }

      if (smallest === index) break;

      const tmp = this.heap[index];
      this.heap[index] = this.heap[smallest]!;
      this.heap[smallest] = tmp!;
      index = smallest;
    }
  }
}
