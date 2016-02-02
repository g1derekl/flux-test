var React = require('react');
var ReactDOM = require('react-dom');
var interact = require('interact.js');

var socket = require('../socket/socket.js');
var alt = require('./alt.js');
var connection = require('./connection.js');

var PlayerStore = alt.PlayerStore;
var PlayerActions = alt.PlayerActions;
var CardStore = alt.CardStore;
var CardActions = alt.CardActions;

var Card = React.createClass({
  getInitialState: function() {
    return {
      highlighted: false
    };
  },
  componentDidMount: function() {
    window.addEventListener('keydown', this._flip);

    interact(ReactDOM.findDOMNode(this))
      .draggable({
        restrict: {
          restriction: "parent",
          elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
        },
        onmove: this._dragHandler
      });
  },
  componentWillUnmount: function() {
    window.removeEventListener('keydown', this._flip);
  },
  _transform: function() {
    return "translate(" + this.props.x + "px, " + this.props.y + "px)";
  },
  _dragHandler: function(e) {
    var x = this.props.x + e.dx;
    var y = this.props.y + e.dy;

    CardActions.moveCard({suit: this.props.suit, value: this.props.value, x: x, y: y, socket: this.props.socket});
  },
  _toggleHighlight: function(e) {
    this.setState({
      highlighted: !this.state.highlighted
    });
  },
  _flip: function(e) {
    if (e.keyCode === 70 && this.state.highlighted) {
      CardActions.flipCard({suit: this.props.suit, value: this.props.value, socket: this.props.socket});
    }
  },
  render: function() {
    var src;

    if (this.props.hidden) {
      src = "/public/cards/card_back.svg";
    }
    else {
      src = "/public/cards/" + this.props.suit + "/" + this.props.value + ".svg";
    }

    return (<img
      className={"card " + (this.state.highlighted ? "highlighted" : "")}
      src={src}
      style={{transform: this._transform()}}
      onMouseOver={this._toggleHighlight}
      onMouseOut={this._toggleHighlight}
    />)
  }
});

var Surface = React.createClass({
  getInitialState: function() {
    return CardStore.getState();
  },
  componentDidMount: function() {
    CardStore.listen(this.onChange);
  },
  componentWillUnmount: function() {
    CardStore.unlisten(this.onChange);
  },
  onChange: function(state) {
    this.setState(state);
  },
  render: function() {
    var self = this;
    return <div className="surface">
      {this.state.cards.map(function(card, index) {return <Card socket={self.props.socket} key={index} suit={card.suit} value={card.value} x={card.x} y={card.y} hidden={card.hidden} />})}
    </div>
  }
});

module.exports = React.createClass({
  getInitialState: function() {
    this.socket = socket(this.props.params.tableName);
    connection(this.socket, alt); // Pass socket instance and actions to handler.

    return PlayerStore.getState();
  },
  componentDidMount: function() {
    PlayerStore.listen(this.onChange);
  },
  componentWillUnmount: function() {
    PlayerStore.unlisten(this.onChange);
  },
  onChange: function(state) {
    this.setState(state);
  },
  render: function() {
    return <div>
      {this.state.players.map(function(player) {return <div key={player.id}>{player.id}</div>})}
      <Surface socket={this.socket} />
    </div>;
  }
});