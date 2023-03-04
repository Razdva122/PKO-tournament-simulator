export interface IPlayer {
  name: string;
  bounty: number;
  state: 'dead' | 'alive';
  deadTime?: number;
  entries: number;
  addon: number;
  payOutBounty: number;
}

export interface IGameState {
  players: IPlayer[];
  isGameEnded: boolean;
  buyIn: number;
  type: 'bounty' | 'regular';

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

export interface IGameActionOUT {
  type: 'OUT';
  loser: string;
}

export interface IGameActionRebuy {
  type: 'Rebuy';
  name: string;
  number: number;
}

export interface IGameActionEnd {
  type: 'End';
}

export interface IGameActionAddon {
  type: 'Addon';
  name: string;
}

export type TGameAction = IGameActionBuyIn | IGameActionKO | IGameActionRebuy | IGameActionEnd | IGameActionOUT | IGameActionAddon;

export type TGameActionWithTime = TGameAction & {time: string};

export type TGameHistory = Array<{state: IGameState; action: TGameActionWithTime}>;

export type TMoneyDisplay = 'BuyIns' | 'Profit' | 'Diff';

export type TEntryType = 'Addon' | 'BuyIn';
