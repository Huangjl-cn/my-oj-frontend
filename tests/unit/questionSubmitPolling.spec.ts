import { QuestionSubmitVO } from "../../generated";
import {
  createQuestionSubmitPoller,
  QUESTION_SUBMIT_POLL_TIMEOUT,
} from "@/services/questionSubmitPolling";
import { QuestionSubmitRequest } from "@/services/questionSubmit";
import { ApiId } from "@/services/apiId";

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const resolvedRequest = (submission: QuestionSubmitVO) => ({
  promise: Promise.resolve(submission),
  cancel: jest.fn(),
});

describe("question submit polling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("covers the backend 60 second sandbox timeout", () => {
    expect(QUESTION_SUBMIT_POLL_TIMEOUT).toBeGreaterThanOrEqual(75000);
  });

  it("passes a Long submission ID to the request without numeric coercion", () => {
    const submitId = "2013621883695575042";
    const request = jest.fn<QuestionSubmitRequest, [ApiId]>(() => ({
      promise: new Promise<QuestionSubmitVO | undefined>(() => undefined),
      cancel: jest.fn(),
    }));
    const polling = createQuestionSubmitPoller({
      request,
      onUpdate: jest.fn(),
    });

    polling.start(submitId);

    expect(request).toHaveBeenCalledWith(submitId);
    polling.stop();
  });

  it("polls through statuses 0 and 1, then stops on status 2 Wrong Answer", async () => {
    const request = jest
      .fn<QuestionSubmitRequest, [ApiId]>()
      .mockReturnValueOnce(resolvedRequest({ status: 0 }))
      .mockReturnValueOnce(resolvedRequest({ status: 1 }))
      .mockReturnValueOnce(
        resolvedRequest({
          status: 2,
          judgeInfo: { message: "Wrong Answer\n用例: 1" },
        })
      );
    const onUpdate = jest.fn();
    const polling = createQuestionSubmitPoller({
      request,
      onUpdate,
      interval: 10,
    });

    polling.start(42);
    await flushPromises();
    jest.advanceTimersByTime(10);
    await flushPromises();
    jest.advanceTimersByTime(10);
    await flushPromises();
    jest.advanceTimersByTime(100);

    expect(request).toHaveBeenCalledTimes(3);
    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 2 })
    );
  });

  it("stops immediately on status 3", async () => {
    const request = jest.fn(() => resolvedRequest({ status: 3 }));
    const polling = createQuestionSubmitPoller({
      request,
      onUpdate: jest.fn(),
      interval: 10,
    });

    polling.start(42);
    await flushPromises();
    jest.advanceTimersByTime(100);

    expect(request).toHaveBeenCalledTimes(1);
  });

  it("does not keep polling an unknown submission status", async () => {
    const request = jest.fn(() => resolvedRequest({ status: 4 }));
    const polling = createQuestionSubmitPoller({
      request,
      onUpdate: jest.fn(),
      interval: 10,
    });

    polling.start(42);
    await flushPromises();
    jest.advanceTimersByTime(100);

    expect(request).toHaveBeenCalledTimes(1);
  });

  it("cancels the active request when stopped", () => {
    const cancel = jest.fn();
    const request = jest.fn(() => ({
      promise: new Promise<QuestionSubmitVO | undefined>(() => undefined),
      cancel,
    }));
    const polling = createQuestionSubmitPoller({
      request,
      onUpdate: jest.fn(),
    });

    polling.start(42);
    polling.stop();

    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("stops at the overall timeout after a pending result", async () => {
    const request = jest.fn(() => resolvedRequest({ status: 0 }));
    const onTimeout = jest.fn();
    const polling = createQuestionSubmitPoller({
      request,
      onUpdate: jest.fn(),
      onTimeout,
      interval: 10,
      timeout: 5,
    });

    polling.start(42);
    await flushPromises();
    jest.advanceTimersByTime(10);
    await flushPromises();

    expect(request).toHaveBeenCalledTimes(1);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });
});
