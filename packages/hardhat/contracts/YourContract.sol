// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract BettingContract {
    address private owner;

    string public greeting = "Initial greeting";

    struct Bet {
        address payable[] players;
        uint256 amount;
        bool isOpen;
        address winner;
    }

    uint256 public betCount;
    mapping(uint256 => Bet) private bets;
    mapping(uint256 => mapping(address => bool)) private hasJoined;

    event BetCreated(uint256 betId, address indexed creator, uint256 amount);
    event BetJoined(uint256 betId, address indexed player);
    event BetResolved(uint256 betId, address indexed winner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Создание пари
    function createBet() external payable {
        require(msg.value > 0, "The bid must be greater than zero");

        address payable[] memory initialPlayers = new address payable[](1);
        initialPlayers[0] = payable(msg.sender);

        bets[betCount] = Bet({
            players: initialPlayers,
            amount: msg.value,
            isOpen: true,
            winner: address(0)
        });

        hasJoined[betCount][msg.sender] = true;

        emit BetCreated(betCount, msg.sender, msg.value);
        betCount++;
    }

    // Присоединение к пари
    function joinBet(uint256 betId) external payable {
        Bet storage bet = bets[betId];
        require(bet.amount != 0, "Bet is not found");
        require(bet.isOpen, "The bet is closed");
        require(!hasJoined[betId][msg.sender], "You are already participating in this bet");
        require(msg.value == bet.amount, "Incorrect bid amount");

        bet.players.push(payable(msg.sender));
        hasJoined[betId][msg.sender] = true;

        emit BetJoined(betId, msg.sender);
    }

    // Разрешение пари
    function resolveBet(uint256 betId, address winner) external onlyOwner {
        Bet storage bet = bets[betId];
        require(bet.amount != 0, "Bet is not found");
        require(isParticipant(betId, winner), "The winner must be a participant in the bet");

        bet.winner = winner;
        bet.isOpen = false;

        uint256 totalPrize = bet.amount * bet.players.length;

        // Отправка средств победителю
        payable(winner).transfer(totalPrize);

        emit BetResolved(betId, winner);
    }

    // Получение списка всех пари
    function getAllBets() external view returns (Bet[] memory) {
        Bet[] memory allBets = new Bet[](betCount);
        for (uint256 i = 0; i < betCount; i++) {
            allBets[i] = bets[i];
        }
        return allBets;
    }

    // Проверка участия пользователя
    function isParticipant(uint256 betId, address participant) public view returns (bool) {
        return hasJoined[betId][participant];
    }
}
