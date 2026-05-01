type Side = "long" | "short";

export interface Order {
  id: string;
  user: string;
  primitive: string;
  side: Side;
  size: number;
  price: number;
  ts: number;
}

export interface Trade {
  id: string;
  bidId: string;
  askId: string;
  primitive: string;
  size: number;
  price: number;
  ts: number;
}

export class Matcher {
  bids: Order[] = [];
  asks: Order[] = [];
  trades: Trade[] = [];

  place(order: Order) {
    if (order.side === "long") {
      this.bids.push(order);
    } else {
      this.asks.push(order);
    }
    this.match();
  }

  match() {
    this.bids.sort((a, b) => b.price - a.price || a.ts - b.ts);
    this.asks.sort((a, b) => a.price - b.price || a.ts - b.ts);

    while (this.bids.length && this.asks.length) {
      const bid = this.bids[0];
      const ask = this.asks[0];

      if (bid.price < ask.price) break;

      const size = Math.min(bid.size, ask.size);
      this.executeTrade(bid, ask, size);

      bid.size -= size;
      ask.size -= size;

      if (bid.size === 0) this.bids.shift();
      if (ask.size === 0) this.asks.shift();
    }
  }

  executeTrade(bid: Order, ask: Order, size: number) {
    const trade: Trade = {
      id: `trade-${Date.now()}-${Math.random()}`,
      bidId: bid.id,
      askId: ask.id,
      primitive: bid.primitive,
      size,
      price: (bid.price + ask.price) / 2,
      ts: Date.now()
    };
    this.trades.push(trade);
    return trade;
  }

  getOrderBook(primitive: string) {
    const relevantBids = this.bids.filter(b => b.primitive === primitive);
    const relevantAsks = this.asks.filter(a => a.primitive === primitive);
    return {
      bids: relevantBids,
      asks: relevantAsks,
      trades: this.trades.filter(t => t.primitive === primitive)
    };
  }

  getUserOrders(user: string) {
    return {
      bids: this.bids.filter(b => b.user === user),
      asks: this.asks.filter(a => a.user === user),
      trades: this.trades.filter(t => {
        const bid = this.bids.find(b => b.id === t.bidId);
        const ask = this.asks.find(a => a.id === t.askId);
        return (bid?.user === user) || (ask?.user === user);
      })
    };
  }
}
