# BrightNest

A blockchain-powered habit tracking system that helps users build and maintain positive routines through transparent, incentive-driven smart contracts.

## Project Overview

BrightNest is a Clarity smart contract project that aims to provide a decentralized platform for users to track their habits and build positive routines. The project leverages the Stacks blockchain to create a transparent and incentive-driven system that encourages users to consistently follow through on their goals.

Key features of the BrightNest project include:

- **Habit Tracking**: Users can create and track their daily habits, with the ability to mark them as complete or missed.
- **Streak Tracking**: The system keeps track of users' habit streaks, rewarding consistent behavior.
- **Incentive Mechanism**: The contract includes a built-in incentive system that rewards users for maintaining their habit streaks.
- **Transparency**: All habit tracking and rewards are recorded on the Stacks blockchain, ensuring transparency and accountability.

## Contract Architecture

The BrightNest project consists of a single smart contract, `brightnest-habits.clar`, which handles the core functionality of the habit tracking system.

### Data Structures

The contract maintains the following key data structures:

1. `habit-streaks`: A map that stores the current streak count for each user and habit.
2. `habit-completions`: A map that tracks the daily habit completion status for each user and habit.

### Public Functions

The contract exposes the following public functions:

1. `complete-habit`: Allows a user to mark a habit as completed for the current day, updating the streak count.
2. `reset-streak`: Enables a user to reset the streak for a specific habit if they have missed a day.
3. `get-habit-streak`: Returns the current streak count for a user and habit.
4. `get-habit-completion`: Checks whether a user has completed a habit for the current day.

### Security and Permissions

The contract uses Clarity's built-in authentication and authorization mechanisms to ensure that only authorized users can interact with the habit tracking system. The contract also includes various security checks and asserts to validate user input and prevent unauthorized state changes.

## Installation & Setup

To set up the BrightNest project, you will need the following:

- Clarinet: A development tool for Clarity smart contracts
- A Stacks wallet (e.g., Hiro Wallet)

1. Clone the BrightNest repository from GitHub.
2. Navigate to the project directory and install the dependencies using Clarinet.
3. Configure your Stacks wallet credentials in the project settings.
4. Build and deploy the `brightnest-habits.clar` contract to the Stacks blockchain.

## Usage Guide

Here are some examples of how to interact with the BrightNest contract:

### Completing a Habit
```clarity
(complete-habit 'user-principal 'exercise)
```
This function call marks the 'exercise' habit as completed for the 'user-principal'. If the user has a streak, it will be incremented. If the user has missed a day, a new streak will be started.

### Resetting a Streak
```clarity
(reset-streak 'user-principal 'exercise)
```
This function allows the 'user-principal' to reset the streak for the 'exercise' habit, for example, if they missed a day.

### Checking Habit Completion
```clarity
(get-habit-completion 'user-principal 'exercise)
```
This read-only function returns a boolean indicating whether the 'user-principal' has completed the 'exercise' habit for the current day.

### Viewing Habit Streak
```clarity
(get-habit-streak 'user-principal 'exercise)
```
This read-only function returns the current streak count for the 'exercise' habit for the 'user-principal'.

## Testing

The BrightNest project includes a comprehensive test suite located in the `/workspace/tests/brightnest-habits_test.ts` file. The tests cover the following scenarios:

- Successful habit completion and streak updates
- Handling missed days and streak resets
- Error conditions and edge cases
- Security checks and authorization

To run the tests, use the Clarinet CLI:

```
clarinet test
```

## Security Considerations

The BrightNest contract includes several security measures to protect user data and ensure the integrity of the habit tracking system:

1. **Principal Authorization**: The contract uses Clarity's built-in authentication mechanisms to ensure that only authorized users can interact with the contract.
2. **Input Validation**: The contract includes various asserts to validate user input and prevent invalid state changes.
3. **Error Handling**: The contract provides detailed error codes and messages to help users understand and handle any errors that may occur.
4. **Streak Reset Checks**: The contract includes checks to ensure that users can only reset their streaks if they have actually missed a day, preventing potential abuse of the incentive system.
