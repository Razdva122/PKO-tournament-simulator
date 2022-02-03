export interface IPlayer {
  name: string;
  bounty: number;
  state: 'dead' | 'alive';
  payOutBounty: number;
}

export interface IGameState {
  players: IPlayer[];
  buyIn: number;

  prizePool: {
    prize: number;
    bounty: number;
  };

  division: {
    prize: number;
    bounty: number;
  };
}

export interface IGameActionBuyIn {
  type: 'BuyIn';
  name: string;
}

export interface IGameActionKO {
  type: 'KO';
  winner: string;
  loser: string;
}

export type TGameAction = IGameActionBuyIn | IGameActionKO;

export type TGameActionWithTime = TGameAction & {time: string};

export type TGameHistory = Array<{state: IGameState; action: TGameActionWithTime}>;
