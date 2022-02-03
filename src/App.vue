<template>
  <div v-if="!gameState">
    <h1>Create tournament</h1>
    <div class="app__input">
      <label for="buyIn">ByuIn in tournament</label>
      <input type="number" name="buyIn" id="buyIn" v-model="buyIn">
    </div>
    <div class="app__input">
      <label for="bountySize">Bounty size in %</label>
      <input type="number" name="bountySize" id="bountySize" max="100" v-model="bountySize">
    </div>
    <div>
      Bounty prize pool will be <b>{{ bountySize }}</b> % of bank
    </div>
    <div>
      Regular prize pool will be <b>{{ 100 - bountySize }}</b> % of bank
    </div>
    <button class="app__green-button" @click="createTournament">Create tournament</button>
  </div>
  <div v-else>
    <h1>Bank / Prize: {{ gameState.prizePool.prize }} / Bounty: {{ gameState.prizePool.bounty }}</h1>
    <div class="app__tournament-actions">
      <div class="app__tournament-buyin app__input">
        <label for="buyInName">Новый игрок (Buy IN)</label>
        <div>
          <input type="text" name="buyInName" id="buyInName" v-model="buyInName">
          <button class="app__green-button" @click="addPlayer">Добавить</button>
        </div>
      </div>
      <div class="app__tournament-ko app__input">
        <label>Нокаут</label>
        <div>
          Победа: <select v-model="winnerKO">
            <option disabled value="">Игрок</option>
            <option v-for="player in activePlayersList" :key="player.name">
              {{ player.name }}
            </option>
          </select>
          Луз: <select v-model="loserKO">
            <option disabled value="">Игрок</option>
            <option v-for="player in activePlayersList" :key="player.name">
              {{ player.name }}
            </option>
          </select>
          <button class="app__red-button" @click="knockoutPlayer">Нокаут</button>
        </div>
      </div>
    </div>
    <div class="app__main-content">
      <div class="app__tournament-players">
        <h3>Список игроков</h3>
        <div class="app__tournament-player" v-for="player, i in activePlayersList" :key="i">
          <span>
            {{ player.name }}
          </span>
          <span>
            Баунти: {{ player.bounty / 2}}
          </span>
          <span>
            Выплата: {{ player.payOutBounty }}
          </span>
        </div>
        <h4>Выбыли</h4>
        <div class="app__players-dead app__tournament-player" v-for="player, i in unactivePlayersList" :key="i">
          <span>
            {{ player.name }}
          </span>
          <span>
            Баунти: {{ player.bounty / 2}}
          </span>
          <span>
            Выплата: {{ player.payOutBounty }}
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
          <template v-else>
            <span class="app__tournament-history-ko">Нокаут</span> / {{ historyEl.action.winner }} выбил {{ historyEl.action.loser }}
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import HelloWorld from './components/HelloWorld.vue'
import { IGameState, TGameHistory, TGameAction, TGameActionWithTime, IPlayer } from './interface'

@Options({
  components: {
    HelloWorld
  }
})
export default class App extends Vue {
  gameState: IGameState | null = null;

  gameHistory: TGameHistory = [];

  buyIn = 0;

  bountySize = 0;

  buyInName = '';

  winnerKO = '';
  loserKO = '';

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

    players.sort((a, b) => b.bounty - a.bounty)

    return players
  }

  createTournament (): void {
    this.gameState = {
      players: [],
      buyIn: this.buyIn,

      prizePool: {
        prize: 0,
        bounty: 0
      },

      division: {
        prize: (100 - this.bountySize) / 100,
        bounty: this.bountySize / 100
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

    this.gameHistory.push({
      state: prevState,
      action: actionWithTime
    })

    if (action.type === 'BuyIn') {
      this.gameState.players.push({
        name: action.name,
        bounty: this.gameState.buyIn * this.gameState.division.bounty,
        state: 'alive',
        payOutBounty: 0
      })

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
    }
  }

  addPlayer (): void {
    if (this.activePlayersList.some(el => el.name === this.buyInName)) {
      return
    }

    this.makeAction({ type: 'BuyIn', name: this.buyInName })
    this.buyInName = ''
  }

  knockoutPlayer (): void {
    if (!this.winnerKO || !this.loserKO) {
      return
    }

    if (this.winnerKO === this.loserKO) {
      return
    }

    this.makeAction({ type: 'KO', winner: this.winnerKO, loser: this.loserKO })
    this.winnerKO = ''
    this.loserKO = ''
  }
}
</script>

<style>
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

.app__tournament-players {
  width: 623px;
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

.app__tournament-history-ko {
  color:red;
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
  width: 200px;
}

.app__tournament-player span:nth-child(2) {
  width: 200px;
}

.app__tournament-player span:nth-child(3) {
  width: 220px;
}
</style>
