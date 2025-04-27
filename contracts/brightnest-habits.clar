;; brightnest-habits.clar
;; A blockchain-powered habit tracking system
;; Helps users build and maintain positive routines

;; Error Codes
;; Comprehensive error codes for clear error identification
(define-constant ERR_UNAUTHORIZED (err u403))           ;; User not authorized to perform action
(define-constant ERR_HABIT_NOT_FOUND (err u404))        ;; Requested habit does not exist
(define-constant ERR_INVALID_INPUT (err u400))          ;; Input validation failed
(define-constant ERR_DUPLICATE_HABIT (err u409))        ;; Attempt to create a duplicate habit
(define-constant ERR_DUPLICATE_LOG (err u422))          ;; Attempting to log habit completion twice
(define-constant ERR_STREAK_RESET_FAILED (err u500))    ;; Failed to reset habit streak

;; Frequency Enumeration
(define-constant FREQUENCY_DAILY u1)
(define-constant FREQUENCY_WEEKLY u2)
(define-constant FREQUENCY_MONTHLY u3)

;; Data Structures
(define-map habits 
  {
    user: principal, 
    habit-id: uint
  }
  {
    name: (string-ascii 50),
    description: (string-ascii 200),
    frequency: uint,
    target-goal: uint,
    total-completions: uint,
    current-streak: uint,
    last-completed: uint
  }
)

(define-map habit-logs
  {
    user: principal,
    habit-id: uint,
    log-date: uint
  }
  bool
)

(define-data-var next-habit-id uint u0)

;; Private Helper Functions
(define-private (increment-habit-id)
  (begin
    (var-set next-habit-id (+ (var-get next-habit-id) u1))
    (var-get next-habit-id)
  )
)

(define-private (is-valid-frequency (freq uint))
  (or 
    (is-eq freq FREQUENCY_DAILY)
    (is-eq freq FREQUENCY_WEEKLY)
    (is-eq freq FREQUENCY_MONTHLY)
  )
)

;; Read-Only Functions
;; Retrieve a specific habit for a user
;; Params:
;;  - user: Principal of the habit owner
;;  - habit-id: Unique identifier of the habit
;; Returns: Optional habit details
(define-read-only (get-habit (user principal) (habit-id uint))
  (map-get? habits {user: user, habit-id: habit-id})
)

;; Get the next available habit ID
;; Returns: The next unused habit ID
(define-read-only (get-next-habit-id)
  (var-get next-habit-id)
)

;; Reset the streak for a habit when it breaks
;; Params:
;;  - habit-id: Unique identifier of the habit
;; Returns: Success status or error
(define-public (reset-habit-streak (habit-id uint))
  (let 
    (
      (habit (unwrap! 
        (map-get? habits {user: tx-sender, habit-id: habit-id}) 
        (err ERR_HABIT_NOT_FOUND)
      ))
    )
    ;; Authorization check
    (asserts! 
      (is-eq tx-sender (get user {user: tx-sender, habit-id: habit-id})) 
      (err ERR_UNAUTHORIZED)
    )

    ;; Reset streak to zero
    (map-set habits 
      {user: tx-sender, habit-id: habit-id}
      (merge habit {current-streak: u0})
    )

    (ok true)
  )
)

;; Public Functions
(define-public (create-habit 
  (name (string-ascii 50)) 
  (description (string-ascii 200)) 
  (frequency uint)
  (target-goal uint)
)
  (let 
    (
      (new-habit-id (increment-habit-id))
    )
    ;; Input Validation
    (asserts! (> (len name) u0) (err ERR_INVALID_INPUT))
    (asserts! (is-valid-frequency frequency) (err ERR_INVALID_INPUT))
    (asserts! (> target-goal u0) (err ERR_INVALID_INPUT))

    ;; Ensure no duplicate habits
    (asserts! 
      (is-none 
        (map-get? habits {
          user: tx-sender, 
          habit-id: new-habit-id
        })
      ) 
      (err ERR_DUPLICATE_HABIT)
    )

    ;; Create Habit
    (map-set habits 
      {user: tx-sender, habit-id: new-habit-id}
      {
        name: name,
        description: description,
        frequency: frequency,
        target-goal: target-goal,
        total-completions: u0,
        current-streak: u0,
        last-completed: u0
      }
    )

    (ok new-habit-id)
  )
)

(define-public (log-habit-completion (habit-id uint) (completion-date uint))
  (let
    (
      (habit (unwrap! 
        (map-get? habits {user: tx-sender, habit-id: habit-id}) 
        (err ERR_HABIT_NOT_FOUND)
      ))
      (log-key {
        user: tx-sender, 
        habit-id: habit-id, 
        log-date: completion-date
      })
    )
    ;; Prevent duplicate logging
    (asserts! 
      (is-none (map-get? habit-logs log-key)) 
      (err ERR_DUPLICATE_LOG)
    )

    ;; Log completion
    (map-set habit-logs log-key true)

    ;; Update habit stats
    (map-set habits 
      {user: tx-sender, habit-id: habit-id}
      (merge habit {
        total-completions: (+ (get total-completions habit) u1),
        current-streak: (+ (get current-streak habit) u1),
        last-completed: completion-date
      })
    )

    (ok true)
  )
)

(define-public (update-habit 
  (habit-id uint)
  (name (optional (string-ascii 50)))
  (description (optional (string-ascii 200)))
  (frequency (optional uint))
  (target-goal (optional uint))
)
  (let
    (
      (habit (unwrap! 
        (map-get? habits {user: tx-sender, habit-id: habit-id}) 
        (err ERR_HABIT_NOT_FOUND)
      ))
      (updated-habit 
        (merge habit 
          {
            name: (default-to (get name habit) name),
            description: (default-to (get description habit) description),
            frequency: (default-to (get frequency habit) frequency),
            target-goal: (default-to (get target-goal habit) target-goal)
          }
        )
      )
    )
    ;; Authorization check
    (asserts! (is-eq tx-sender (get user {user: tx-sender, habit-id: habit-id})) 
      (err ERR_UNAUTHORIZED)
    )

    ;; Validate updated inputs
    (asserts! 
      (and 
        (> (len (get name updated-habit)) u0)
        (is-valid-frequency (get frequency updated-habit))
        (> (get target-goal updated-habit) u0)
      )
      (err ERR_INVALID_INPUT)
    )

    ;; Update habit
    (map-set habits 
      {user: tx-sender, habit-id: habit-id}
      updated-habit
    )

    (ok true)
  )
)