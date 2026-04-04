import { useToastStore } from "@/stores/toast-store";
import type { Toast, ToastVariant } from "@/stores/toast-store";

const makeToastInput = (
  overrides: Partial<Omit<Toast, "id" | "createdAt" | "exiting">> = {},
) => ({
  title: "Test toast",
  variant: "default" as ToastVariant,
  duration: 3000,
  ...overrides,
});

const resetStore = () => useToastStore.setState({ toasts: [] });

describe("useToastStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("initial state", () => {
    it("starts with an empty toasts array", () => {
      expect(useToastStore.getState().toasts).toEqual([]);
    });
  });

  describe("addToast", () => {
    it("returns a unique string id", () => {
      const id1 = useToastStore.getState().addToast(makeToastInput());
      const id2 = useToastStore.getState().addToast(makeToastInput());

      expect(typeof id1).toBe("string");
      expect(typeof id2).toBe("string");
      expect(id1).not.toBe(id2);
    });

    it("adds the toast to state with id and createdAt", () => {
      const input = makeToastInput({ title: "Hello", variant: "success" });
      const id = useToastStore.getState().addToast(input);

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0]).toMatchObject({
        id,
        title: "Hello",
        variant: "success",
        duration: 3000,
      });
      expect(toasts[0].createdAt).toBeTypeOf("number");
    });

    it("preserves description when provided", () => {
      const input = makeToastInput({ description: "Extra details" });
      useToastStore.getState().addToast(input);

      expect(useToastStore.getState().toasts[0].description).toBe(
        "Extra details",
      );
    });

    it("evicts the oldest toast when exceeding MAX_VISIBLE (3)", () => {
      const { addToast } = useToastStore.getState();
      const id1 = addToast(makeToastInput({ title: "Toast 1" }));
      addToast(makeToastInput({ title: "Toast 2" }));
      addToast(makeToastInput({ title: "Toast 3" }));
      addToast(makeToastInput({ title: "Toast 4" }));

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(3);
      expect(toasts.find((t) => t.id === id1)).toBeUndefined();
      expect(toasts.map((t) => t.title)).toEqual([
        "Toast 2",
        "Toast 3",
        "Toast 4",
      ]);
    });

    it("keeps evicting when adding beyond the limit", () => {
      const { addToast } = useToastStore.getState();
      addToast(makeToastInput({ title: "T1" }));
      addToast(makeToastInput({ title: "T2" }));
      addToast(makeToastInput({ title: "T3" }));
      addToast(makeToastInput({ title: "T4" }));
      addToast(makeToastInput({ title: "T5" }));

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(3);
      expect(toasts.map((t) => t.title)).toEqual(["T3", "T4", "T5"]);
    });
  });

  describe("dismissToast", () => {
    it("removes the toast with the given id", () => {
      const id1 = useToastStore.getState().addToast(makeToastInput({ title: "A" }));
      const id2 = useToastStore.getState().addToast(makeToastInput({ title: "B" }));

      useToastStore.getState().dismissToast(id1);

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].id).toBe(id2);
    });

    it("does nothing when the id does not exist", () => {
      useToastStore.getState().addToast(makeToastInput({ title: "A" }));

      useToastStore.getState().dismissToast("nonexistent-id");

      expect(useToastStore.getState().toasts).toHaveLength(1);
    });

    it("does nothing on an already empty list", () => {
      useToastStore.getState().dismissToast("any-id");

      expect(useToastStore.getState().toasts).toEqual([]);
    });
  });

  describe("markExiting", () => {
    it("sets exiting to true on the matching toast", () => {
      const id = useToastStore.getState().addToast(makeToastInput());

      useToastStore.getState().markExiting(id);

      const toast = useToastStore.getState().toasts.find((t) => t.id === id);
      expect(toast?.exiting).toBe(true);
    });

    it("does not affect other toasts", () => {
      const id1 = useToastStore.getState().addToast(makeToastInput({ title: "A" }));
      const id2 = useToastStore.getState().addToast(makeToastInput({ title: "B" }));

      useToastStore.getState().markExiting(id1);

      const t1 = useToastStore.getState().toasts.find((t) => t.id === id1);
      const t2 = useToastStore.getState().toasts.find((t) => t.id === id2);
      expect(t1?.exiting).toBe(true);
      expect(t2?.exiting).toBeUndefined();
    });

    it("does nothing when the id does not exist", () => {
      const id = useToastStore.getState().addToast(makeToastInput());

      useToastStore.getState().markExiting("nonexistent-id");

      const toast = useToastStore.getState().toasts.find((t) => t.id === id);
      expect(toast?.exiting).toBeUndefined();
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });
});
