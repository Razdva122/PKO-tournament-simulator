<template>
  <div v-if="!gameState">
    <h1>Создание турнира</h1>
    <div class="app__input">
      <label for="buyIn">Вход в турнир</label>
      <input type="number" name="buyIn" id="buyIn" v-model="buyIn">
    </div>
    <div class="app__input">
      <label for="buyIn">Тип турнира</label>
      <select class="app__input-tournament-type" v-model="tournamentType">
        <option value="regular">Обычный</option>
        <option value="bounty">Прогресивный Нокаут</option>
      </select>
    </div>
    <template v-if="tournamentType === 'bounty'">
      <div class="app__input">
        <label for="bountySize">Награды за выбивание в процентах</label>
        <input type="number" name="bountySize" id="bountySize" max="100" v-model="bountySize">
      </div>
      <div>
        Призовой за выбивание будет <b>{{ bountySize }}</b> % от банка
      </div>
      <div>
        Обычный призовой будет <b>{{ 100 - bountySize }}</b> % от банка
      </div>
    </template>
    <div>
      <button class="app__green-button" @click="createTournament">Создать турнир</button>
    </div>
    <div v-if="isPrevStateExist">
      <button class="app__green-button" @click="restoreLastTournament">Восстановить турнир</button>
    </div>
  </div>
  <div v-else>
    <h1>Банк / Призовой: {{ gameState.prizePool.prize }}
      <template v-if="isBountyTournament">/ Награды за выбивание: {{ gameState.prizePool.bounty }}
      </template>
    </h1>
    <div class="app__tournament-actions" v-if="!isGameEnded">
      <div class="app__tournament-buyin app__input">
        <template v-if="entryShowType === 'BuyIn'">
          <label @click="toggleBuyInType" for="buyInName">Новый игрок (Buy IN)</label>
          <div>
            <input type="text" name="buyInName" id="buyInName" v-model="buyInName">
            <button class="app__green-button" @click="addPlayer">Добавить</button>
          </div>
        </template>
        <template v-else>
          <label @click="toggleBuyInType" for="addonName">Аддон</label>
          <div>
            <select v-model="addonName">
              <option disabled value="">Имя</option>
              <option v-for="player in activePlayersList" :key="player.name">
                {{ player.name }}
              </option>
            </select>
            <button class="app__green-button" @click="addonPlayer">Докуп</button>
          </div>
        </template>
      </div>
      <template v-if="isBountyTournament">
        <div class="app__tournament-ko app__input">
          <label>Нокаут</label>
          <div>
            Победа: <select v-model="winnerKO">
              <option disabled value="">Игрок</option>
              <option v-for="player in activePlayersList" :key="player.name">
                {{ player.name }}
              </option>
            </select>
            Луз: <select v-model="loser">
              <option disabled value="">Игрок</option>
              <option v-for="player in activePlayersList" :key="player.name">
                {{ player.name }}
              </option>
            </select>
            <button class="app__red-button" @click="knockoutPlayer">Нокаут</button>
            <input class="app__input-checkbox" type="checkbox" id="checkbox" v-model="instaRebuy">
            <label for="checkbox">Лузер ребай: {{instaRebuy ? 'Да' : 'Нет'}}</label>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="app__tournament-ko app__input">
          <label>Аут</label>
          <div>
            <div>
              Луз: <select v-model="loser">
              <option disabled value="">Игрок</option>
              <option v-for="player in activePlayersList" :key="player.name">
                {{ player.name }}
              </option>
              </select>
              <button class="app__red-button" @click="outPlayer">Аут</button>
            </div>
            <div>
              <input class="app__input-checkbox" type="checkbox" id="checkbox" v-model="instaRebuy">
              <label for="checkbox">Лузер ребай: {{instaRebuy ? 'Да' : 'Нет'}}</label>
            </div>
          </div>
        </div>
      </template>
    </div>
    <div class="app__main-content">
      <div class="app__tournament-players">
        <h3>Список игроков</h3>
        <div class="app__tournament-player" :class="{ bounty: isBountyTournament }" v-for="player, i in activePlayersList" :key="i">
          <span>
            {{ player.name }} {{ player.entries + player.addon > 1 ? `(${player.entries}+${player.addon})` : '' }}
          </span>
          <span v-show="isBountyTournament">
            Баунти: {{ Math.floor(player.bounty / 2)}}
          </span>
          <span @click="toggleMoneyShowType">
            <template v-if="moneyShowType === 'Profit'">
              Выплата: {{ Math.floor(player.payOutBounty) }}
            </template>
            <template v-else-if="moneyShowType === 'Diff'">
              Прибыль: {{ Math.floor(player.payOutBounty - (player.entries + player.addon) * gameState.buyIn) }}
            </template>
            <template v-else-if="moneyShowType === 'BuyIns'">
              Входы: {{ Math.floor((player.entries + player.addon) * gameState.buyIn) }}
            </template>
          </span>
        </div>
        <h4>{{ isGameEnded ? 'Результаты' : 'Выбыли' }}</h4>
        <div class="app__players-dead app__tournament-player" :class="{ bounty: isBountyTournament }" v-for="player, i in unactivePlayersList" :key="i">
          <span>
            {{i + activePlayersList.length + 1}}) {{ player.name }} {{ player.entries + player.addon > 1 ? `(${player.entries}+${player.addon})` : '' }}
          </span>
          <span v-show="isBountyTournament">
            Баунти: {{ Math.floor(player.bounty / 2)}}
          </span>
          <span @click="toggleMoneyShowType">
            <template v-if="moneyShowType === 'Profit'">
              Выплата: {{ Math.floor(player.payOutBounty) }}
            </template>
            <template v-else-if="moneyShowType === 'Diff'">
              Прибыль: {{ Math.floor(player.payOutBounty - (player.entries + player.addon) * gameState.buyIn) }}
            </template>
            <template v-else-if="moneyShowType === 'BuyIns'">
              Входы: {{ Math.floor((player.entries + player.addon) * gameState.buyIn) }}
            </template>
          </span>
        </div>
      </div>

      <div class="app__tournament-history">
        <h3>История <button class="app__red-button" @click="revertLastAction">Отменить</button></h3>
        <div class="app__tournament-history-element" v-for="historyEl, i in gameHistoryReversed" :key="i">
          {{ historyEl.action.time }} /
          <template v-if="historyEl.action.type === 'BuyIn'">
            <span class="app__tournament-history-buyin">Вход</span>  / {{ historyEl.action.name }}
          </template>
          <template v-else-if="historyEl.action.type === 'Rebuy'">
            <span class="app__tournament-history-rebuy">Ребай({{ historyEl.action.number }})</span>  / {{ historyEl.action.name }}
          </template>
          <template v-else-if="historyEl.action.type === 'KO'">
            <span class="app__tournament-history-ko">Нокаут</span> / {{ historyEl.action.winner }} выбил {{ historyEl.action.loser }}
          </template>
          <template v-else-if="historyEl.action.type === 'OUT'">
            <span class="app__tournament-history-ko">Аут</span> / {{ historyEl.action.loser }}
          </template>
          <template v-else-if="historyEl.action.type === 'Addon'">
            <span class="app__tournament-history-addon">Аддон</span> / {{ historyEl.action.name }}
          </template>
          <template v-else>
            <span class="app__tournament-history-win">Победа</span> / {{ unactivePlayersList[0].name }}
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component'
import {
  IGameState, TGameHistory, TGameAction,
  TGameActionWithTime, IPlayer, IGameActionRebuy,
  TMoneyDisplay, TEntryType
} from './interface'
import { nameNormalizer } from './helpers'

export default class App extends Vue {
  gameState: IGameState | null = null;

  gameHistory: TGameHistory = [];

  buyIn = 0;

  bountySize = 0;
  tournamentType: IGameState['type'] = 'regular';

  buyInName = '';
  addonName = '';

  winnerKO = '';
  loser = '';
  instaRebuy = false;

  moneyShowType: TMoneyDisplay = 'Profit';

  entryShowType: TEntryType = 'BuyIn';

  get gameHistoryReversed (): TGameHistory {
    return [...this.gameHistory].reverse()
  }

  get activePlayersList (): IPlayer[] {
    const players = this.gameState!.players.filter((el) => el.state === 'alive')

    players.sort((a, b) => b.bounty - a.bounty)

    return players
  }

  get unactivePlayersList (): IPlayer[] {
    const players = this.gameState!.players.filter((el) => el.state === 'dead')

    players.sort((a, b) => b.deadTime! - a.deadTime!)

    return players
  }

  get isBountyTournament (): boolean {
    return this.gameState!.type === 'bounty'
  }

  get isGameEnded (): boolean {
    return this.gameState!.isGameEnded
  }

  get isPrevStateExist (): boolean {
    return Boolean(localStorage.getItem('pokerTournamentState')) && Boolean(localStorage.getItem('pokerTournamentState'))
  }

  createTournament (): void {
    this.gameState = {
      isGameEnded: false,
      players: [],
      buyIn: this.buyIn,
      type: this.tournamentType,

      prizePool: {
        prize: 0,
        bounty: 0
      },

      division: {
        prize: this.tournamentType === 'bounty' ? (100 - this.bountySize) / 100 : 100,
        bounty: this.tournamentType === 'bounty' ? this.bountySize / 100 : 0
      }
    }
  }

  revertLastAction (): void {
    const lastEl = this.gameHistory.splice(this.gameHistory.length - 1, 1)[0]

    this.gameState = lastEl.state
  }

  makeAction (action: TGameAction): void {
    if (!this.gameState) {
      return
    }

    const prevState = JSON.parse(JSON.stringify(this.gameState))

    const hours = new Date().getHours()
    const mins = new Date().getMinutes() < 10 ? `0${new Date().getMinutes()}` : new Date().getMinutes()

    const actionWithTime: TGameActionWithTime = {
      ...action,
      time: `${hours}:${mins}`
    }

    if (action.type === 'BuyIn') {
      const player = this.gameState.players.find((el) => el.name === action.name)

      if (player) {
        player.state = 'alive'
        player.entries += 1
        player.deadTime = undefined
        player.bounty = this.gameState.buyIn * this.gameState.division.bounty

        const rebuyAction = actionWithTime as IGameActionRebuy

        rebuyAction.type = 'Rebuy'
        rebuyAction.number = player.entries
      } else {
        this.gameState.players.push({
          name: action.name,
          bounty: this.gameState.buyIn * this.gameState.division.bounty,
          state: 'alive',
          addon: 0,
          entries: 1,
          payOutBounty: 0
        })
      }

      this.gameState.prizePool.prize += this.gameState.buyIn * this.gameState.division.prize
      this.gameState.prizePool.bounty += this.gameState.buyIn * this.gameState.division.bounty
    }

    if (action.type === 'Addon') {
      const player = this.gameState.players.find((el) => el.name === action.name && el.state === 'alive')!

      player.addon += 1
      player.bounty += this.gameState.buyIn * this.gameState.division.bounty

      this.gameState.prizePool.prize += this.gameState.buyIn * this.gameState.division.prize
      this.gameState.prizePool.bounty += this.gameState.buyIn * this.gameState.division.bounty
    }

    if (action.type === 'KO') {
      const winner = this.gameState.players.find((el) => el.name === action.winner && el.state === 'alive')!
      const loser = this.gameState.players.find((el) => el.name === action.loser && el.state === 'alive')!

      if (this.activePlayersList.length === 2) {
        winner.payOutBounty += winner.bounty + loser.bounty / 2
        loser.payOutBounty += loser.bounty / 2
      } else {
        winner.bounty += loser.bounty / 2
        winner.payOutBounty += loser.bounty / 2
      }

      loser.state = 'dead'
      loser.deadTime = Date.now()

      if (this.activePlayersList.length === 1) {
        winner.state = 'dead'
        winner.deadTime = Date.now() + 1000

        this.$nextTick(() => this.makeAction({ type: 'End' }))
      }
    }

    if (action.type === 'OUT') {
      const loser = this.gameState.players.find((el) => el.name === action.loser && el.state === 'alive')!

      loser.state = 'dead'
      loser.deadTime = Date.now()

      if (this.activePlayersList.length === 1) {
        this.activePlayersList[0].deadTime = Date.now() + 1000
        this.activePlayersList[0].state = 'dead'

        this.$nextTick(() => this.makeAction({ type: 'End' }))
      }
    }

    if (action.type === 'End') {
      this.gameState.isGameEnded = true
    }

    this.gameHistory.push({
      state: prevState,
      action: actionWithTime
    })

    localStorage.setItem('pokerTournamentState', JSON.stringify(this.gameState))
    localStorage.setItem('pokerTournamentHistory', JSON.stringify(this.gameHistory))
  }

  addPlayer (): void {
    if (!this.buyInName) {
      return
    }

    const playerNameNormalized = nameNormalizer(this.buyInName)

    if (this.activePlayersList.some(el => el.name === playerNameNormalized)) {
      return
    }

    this.makeAction({ type: 'BuyIn', name: playerNameNormalized })
    this.buyInName = ''
  }

  addonPlayer (): void {
    if (!this.addonName) {
      return
    }

    const playerNameNormalized = nameNormalizer(this.addonName)

    if (!this.activePlayersList.some(el => el.name === playerNameNormalized)) {
      return
    }

    this.makeAction({ type: 'Addon', name: playerNameNormalized })
    this.addonName = ''
  }

  knockoutPlayer (): void {
    if (!this.winnerKO || !this.loser) {
      return
    }

    if (this.winnerKO === this.loser) {
      return
    }

    this.makeAction({ type: 'KO', winner: this.winnerKO, loser: this.loser })

    if (this.instaRebuy) {
      this.makeAction({ type: 'BuyIn', name: this.loser })
    }

    this.winnerKO = ''
    this.loser = ''
    this.instaRebuy = false
  }

  outPlayer (): void {
    if (!this.loser) {
      return
    }

    this.makeAction({ type: 'OUT', loser: this.loser })

    if (this.instaRebuy) {
      this.makeAction({ type: 'BuyIn', name: this.loser })
    }

    this.loser = ''
    this.instaRebuy = false
  }

  restoreLastTournament (): void {
    this.gameState = JSON.parse(localStorage.getItem('pokerTournamentState')!)
    this.gameHistory = JSON.parse(localStorage.getItem('pokerTournamentHistory')!)
  }

  toggleMoneyShowType (): void {
    if (this.moneyShowType === 'Profit') {
      this.moneyShowType = 'Diff'
    } else if (this.moneyShowType === 'Diff') {
      this.moneyShowType = 'BuyIns'
    } else if (this.moneyShowType === 'BuyIns') {
      this.moneyShowType = 'Profit'
    }
  }

  toggleBuyInType (): void {
    if (this.entryShowType === 'Addon') {
      this.entryShowType = 'BuyIn'
    } else if (this.entryShowType === 'BuyIn') {
      this.entryShowType = 'Addon'
    }
  }
}
</script>

<style>
* { -moz-box-sizing: border-box; -webkit-box-sizing: border-box; -ms-box-sizing: border-box; box-sizing: border-box; }

#app {
  margin-right: 20px;
  margin-left: 20px;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

h3 {
  margin: 20px 0
}

h4 {
  margin: 10px 0
}

.app__input {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  align-items: center;
}

.app__input label {
  font-size: 20px;
}

.app__input input {
  margin-right: 10px;
  height: 20px;
  width: 200px;
}

.app__input .app__input-tournament-type {
  width: 200px;
}

.app__input .app__input-checkbox {
  margin-left: 20px;
  width: auto;
  height: auto;
}

.app__input select {
  margin-right: 10px;
  height: 26px;
  width: 100px;
}

.app__green-button {
  background-color: #2ea44f;
  font-size: 20px;
  color: white;
  border-radius: 6px;
  height: 30px;
  margin-top: 10px;
  border: none;
}

.app__red-button {
  background-color: #FF4742;
  font-size: 20px;
  color: white;
  border-radius: 6px;
  height: 30px;
  margin-top: 10px;
  border: none;
}

.app__main-content {
  display: flex;
  justify-content: space-between;
}

.app__main-content div{
  font-size: 30px;
}

.app__tournament-actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.app__tournament-players.bounty {
  width: 683px;
}

.app__tournament-players {
  width: 680px;
}

.app__tournament-history {
  min-width: 500px;
}

.app__tournament-history-element {
  text-align: left;
  border-bottom: 1px solid grey;
}

.app__tournament-buyin {
  margin-right: 50px;
}

.app__tournament-history-buyin {
  color: green;
}

.app__tournament-history-rebuy {
  color: #ff9966;
}

.app__tournament-history-ko {
  color:red;
}

.app__tournament-history-addon {
  color:#c5c9c7;
}

.app__tournament-history-win {
  color:goldenrod;
}

.app__players-dead {
  text-decoration: line-through;
}

.app__tournament-player {
  text-align: left;
  border-top: 1px solid grey;
  border-bottom: 1px solid grey;
}

.app__tournament-player span {
  border-right: 1px solid black;
  display: inline-block;
}

.app__tournament-player span:nth-child(1) {
  width: 220px;
}

.app__tournament-player span:nth-child(2) {
  width: 210px;
}

.app__tournament-player span:nth-child(3) {
  width: 250px;
}

@media screen and (max-width: 1000px) {
  #app {
    margin: auto;
    max-width: 100%;
  }

  .app__tournament-actions {
    flex-direction: column;
  }

  .app__main-content {
    flex-direction: column;
  }

  .app__tournament-players {
    width: 100%;
  }

  .app__tournament-player span:nth-child(1) {
    width: 40%;
  }

  .app__tournament-player span:nth-child(3) {
    width: 60%;
  }

  .app__tournament-history {
    min-width: 100%;
  }

  .app__main-content div {
    font-size: 24px;
  }

  .app__tournament-buyin {
    margin-right: 0;
  }
}
</style>
