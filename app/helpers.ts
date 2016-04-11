/**
 * @license MIT
 * @author 0@39.yt (Yurij Mikhalevich)
 * @module helpers
 */

export function ifTriggeredByInputExecuteOnlyIfContentIsValid(onInvalid: Function) {
  return function(
    target: Object,
    name: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const originalMethod: Function = descriptor.value;
    descriptor.value = function(event: Event) {
      if (event && event.target instanceof HTMLInputElement) {
        const input = <HTMLInputElement> event.target;
        if (!input.validity.valid) {
          onInvalid.apply(this);
          return;
        }
      }
      return originalMethod.apply(this);
    };
    return descriptor;
  }
}
