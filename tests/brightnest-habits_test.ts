import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

// Constants for error codes
const ERR_UNAUTHORIZED = 403;
const ERR_HABIT_NOT_FOUND = 404;
const ERR_INVALID_INPUT = 400;
const ERR_DUPLICATE_HABIT = 409;
const ERR_DUPLICATE_LOG = 422;

// Frequency Constants
const FREQUENCY_DAILY = 1;
const FREQUENCY_WEEKLY = 2;
const FREQUENCY_MONTHLY = 3;

Clarinet.test({
  name: "Habit Creation: Successful habit creation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    let block = chain.mineBlock([
      Tx.contractCall(
        "brightnest-habits", 
        "create-habit", 
        [
          types.ascii("Morning Exercise"),
          types.ascii("Daily workout routine"),
          types.uint(FREQUENCY_DAILY),
          types.uint(30)
        ],
        deployer.address
      )
    ]);

    block.receipts[0].result.expectOk().expectUint(1);
  }
});

Clarinet.test({
  name: "Habit Creation: Invalid inputs prevent habit creation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Test empty name
    let block = chain.mineBlock([
      Tx.contractCall(
        "brightnest-habits", 
        "create-habit", 
        [
          types.ascii(""),
          types.ascii("Invalid Habit"),
          types.uint(FREQUENCY_DAILY),
          types.uint(30)
        ],
        deployer.address
      )
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_INVALID_INPUT);

    // Test invalid frequency
    block = chain.mineBlock([
      Tx.contractCall(
        "brightnest-habits", 
        "create-habit", 
        [
          types.ascii("Invalid Frequency Habit"),
          types.ascii("Invalid Habit"),
          types.uint(4),  // Invalid frequency
          types.uint(30)
        ],
        deployer.address
      )
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_INVALID_INPUT);

    // Test zero target goal
    block = chain.mineBlock([
      Tx.contractCall(
        "brightnest-habits", 
        "create-habit", 
        [
          types.ascii("Zero Goal Habit"),
          types.ascii("Invalid Habit"),
          types.uint(FREQUENCY_DAILY),
          types.uint(0)
        ],
        deployer.address
      )
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_INVALID_INPUT);
  }
});

Clarinet.test({
  name: "Habit Completion: Successful logging and streak tracking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // First create a habit
    let block = chain.mineBlock([
      Tx.contractCall(
        "brightnest-habits", 
        "create-habit", 
        [
          types.ascii("Reading"),
          types.ascii("Daily reading habit"),
          types.uint(FREQUENCY_DAILY),
          types.uint(30)
        ],
        deployer.address
      )
    ]);
    block.receipts[0].result.expectOk().expectUint(1);

    // Log habit completion
    block = chain.mineBlock([
      Tx.contractCall(
        "brightnest-habits", 
        "log-habit-completion", 
        [
          types.uint(1),
          types.uint(1682890000)  // Sample timestamp
        ],
        deployer.address
      )
    ]);
    block.receipts[0].result.expectOk();

    // Verify habit details after completion
    const habit = chain.callReadOnlyFn(
      "brightnest-habits", 
      "get-habit", 
      [
        types.principal(deployer.address),
        types.uint(1)
      ],
      deployer.address
    );

    habit.result.expectSome().expectTuple({
      "name": types.ascii("Reading"),
      "total-completions": types.uint(1),
      "current-streak": types.uint(1)
    });
  }
});

Clarinet.test({
  name: "Habit Completion: Prevent duplicate logging",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Create habit and log first completion
    let block = chain.mineBlock([
      Tx.contractCall(
        "brightnest-habits", 
        "create-habit", 
        [
          types.ascii("Exercise"),
          types.ascii("Daily exercise"),
          types.uint(FREQUENCY_DAILY),
          types.uint(30)
        ],
        deployer.address
      ),
      Tx.contractCall(
        "brightnest-habits", 
        "log-habit-completion", 
        [
          types.uint(1),
          types.uint(1682890000)  // Same timestamp
        ],
        deployer.address
      )
    ]);

    // Try logging same completion again
    block = chain.mineBlock([
      Tx.contractCall(
        "brightnest-habits", 
        "log-habit-completion", 
        [
          types.uint(1),
          types.uint(1682890000)  // Same timestamp
        ],
        deployer.address
      )
    ]);

    block.receipts[0].result.expectErr().expectUint(ERR_DUPLICATE_LOG);
  }
});

Clarinet.test({
  name: "Access Control: Only habit owner can modify or log habit",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;
    
    // Create habit
    let block = chain.mineBlock([
      Tx.contractCall(
        "brightnest-habits", 
        "create-habit", 
        [
          types.ascii("Reading"),
          types.ascii("Daily reading"),
          types.uint(FREQUENCY_DAILY),
          types.uint(30)
        ],
        deployer.address
      )
    ]);
    block.receipts[0].result.expectOk().expectUint(1);

    // Another user tries to log completion
    block = chain.mineBlock([
      Tx.contractCall(
        "brightnest-habits", 
        "log-habit-completion", 
        [
          types.uint(1),
          types.uint(1682890000)
        ],
        wallet1.address
      )
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_HABIT_NOT_FOUND);

    // Another user tries to update habit
    block = chain.mineBlock([
      Tx.contractCall(
        "brightnest-habits", 
        "update-habit", 
        [
          types.uint(1),
          types.some(types.ascii("New Name")),
          types.none(),
          types.none(),
          types.none()
        ],
        wallet1.address
      )
    ]);
    block.receipts[0].result.expectErr().expectUint(ERR_HABIT_NOT_FOUND);
  }
});

Clarinet.test({
  name: "Habit Maintenance: Update habit details",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Create habit
    let block = chain.mineBlock([
      Tx.contractCall(
        "brightnest-habits", 
        "create-habit", 
        [
          types.ascii("Reading"),
          types.ascii("Daily reading"),
          types.uint(FREQUENCY_DAILY),
          types.uint(30)
        ],
        deployer.address
      )
    ]);
    block.receipts[0].result.expectOk().expectUint(1);

    // Update habit details
    block = chain.mineBlock([
      Tx.contractCall(
        "brightnest-habits", 
        "update-habit", 
        [
          types.uint(1),
          types.some(types.ascii("Updated Reading")),
          types.some(types.ascii("Updated daily reading description")),
          types.some(types.uint(FREQUENCY_WEEKLY)),
          types.some(types.uint(45))
        ],
        deployer.address
      )
    ]);
    block.receipts[0].result.expectOk();

    // Verify updated details
    const habit = chain.callReadOnlyFn(
      "brightnest-habits", 
      "get-habit", 
      [
        types.principal(deployer.address),
        types.uint(1)
      ],
      deployer.address
    );

    habit.result.expectSome().expectTuple({
      "name": types.ascii("Updated Reading"),
      "description": types.ascii("Updated daily reading description"),
      "frequency": types.uint(FREQUENCY_WEEKLY),
      "target-goal": types.uint(45)
    });
  }
});

Clarinet.test({
  name: "Habit Streak Management: Reset streak",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Create habit and log completions
    let block = chain.mineBlock([
      Tx.contractCall(
        "brightnest-habits", 
        "create-habit", 
        [
          types.ascii("Exercise"),
          types.ascii("Daily exercise"),
          types.uint(FREQUENCY_DAILY),
          types.uint(30)
        ],
        deployer.address
      ),
      Tx.contractCall(
        "brightnest-habits", 
        "log-habit-completion", 
        [
          types.uint(1),
          types.uint(1682890000)
        ],
        deployer.address
      ),
      Tx.contractCall(
        "brightnest-habits", 
        "log-habit-completion", 
        [
          types.uint(1),
          types.uint(1682976400)
        ],
        deployer.address
      )
    ]);

    // Reset streak
    block = chain.mineBlock([
      Tx.contractCall(
        "brightnest-habits", 
        "reset-habit-streak", 
        [types.uint(1)],
        deployer.address
      )
    ]);
    block.receipts[0].result.expectOk();

    // Verify streak reset
    const habit = chain.callReadOnlyFn(
      "brightnest-habits", 
      "get-habit", 
      [
        types.principal(deployer.address),
        types.uint(1)
      ],
      deployer.address
    );

    habit.result.expectSome().expectTuple({
      "current-streak": types.uint(0)
    });
  }
});