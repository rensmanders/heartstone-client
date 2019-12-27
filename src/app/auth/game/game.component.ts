import { Component, OnInit } from '@angular/core';
import {WebsocketService} from "../../services/websocket.service";
import * as Stomp from 'stompjs';
import * as SockJS from 'sockjs-client';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { game } from '../../models/game/game';
import { deck } from '../../models/game/deck';
import { hand } from '../../models/game/hand';
import { card } from '../../models/game/card';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent {
  private stompClient;
  private socketUrl = `ws://localhost:8095/socket?token=${this.auth.getJWT()}`;
  private token: String;
  private socket = new WebSocket(this.socketUrl);
  private ws = Stomp.over(this.socket);

  public game : game;
  public deck : deck;
  public hand : hand;

  constructor(private auth: AuthService, private route : ActivatedRoute) {
    let _this = this;

    this.ws.connect({}, function(frame) {
      _this.ws.send(`/app/game/${_this.route.snapshot.paramMap.get("id")}`, {}, JSON.stringify({"actionType": "game_init"}));
      
      _this.ws.subscribe(`/user/topic/game`, message => {
        const object = JSON.parse(message.body);

        if(object.type == "game_state") {
          _this.game = {
            players : object.board.players.filter(player => player.id != _this.auth.getUserId()),
            currentPlayer : object.board.currentPlayer,
            ownPlayer : object.board.players.find(player => player.id == _this.auth.getUserId()),
            discardPile : object.board.discardPile,
            message : object.board.message
          };
        }

        if(object.type == "private_game_state") {
          _this.deck = object.deck;
          _this.hand = object.hand;
        }

        console.log(_this.deck);
      });
    }, function(error) {
      console.log(error);
    }); 
  }

  counter(i : number) {
    return new Array(i);
  }

  takeCard() {
    this.ws.send(`/app/game/${this.route.snapshot.paramMap.get("id")}`, {}, JSON.stringify({"actionType": "take_card"}));
  }
  
  endTurn() {
    this.ws.send(`/app/game/${this.route.snapshot.paramMap.get("id")}`, {}, JSON.stringify({"actionType": "end_turn"}));
  }

  playCard() {

  }
}
