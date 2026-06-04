import Pusher from "pusher";

const useMock =
  !process.env.PUSHER_APP_ID ||
  !process.env.NEXT_PUBLIC_PUSHER_KEY ||
  !process.env.PUSHER_SECRET;

class MockPusher {
  async trigger(channel: string, event: string, data: any) {
    console.log(
      `[MockPusher] Triggered event "${event}" on channel "${channel}" with data:`,
      data
    );
    return { status: 200 };
  }
}

export const pusherServer = useMock
  ? (new MockPusher() as unknown as Pusher)
  : new Pusher({
      appId: process.env.PUSHER_APP_ID || "",
      key: process.env.NEXT_PUBLIC_PUSHER_KEY || "",
      secret: process.env.PUSHER_SECRET || "",
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
      useTLS: true,
    });
