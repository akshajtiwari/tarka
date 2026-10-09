jest.useFakeTimers();

test('git work pauses for the UI only after running a while without a break', async () => {
  const { maybeYield } = require('../lib/yieldToUi');
  await maybeYield(); // just started: no pause

  jest.advanceTimersByTime(20); // 20 ms of work without a break
  let resumed = false;
  const paused = maybeYield().then(() => (resumed = true));
  await Promise.resolve();
  expect(resumed).toBe(false); // waiting for the timer, so the UI can run

  jest.runAllTimers();
  await paused;
  expect(resumed).toBe(true);
  await maybeYield(); // the break just happened: no pause again
});
