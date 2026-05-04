/**
 * Multi-step flow navigation context provider.
 *
 * Manages the step-based progress indicator state and navigation rules
 * for the card management workflow. Enforces sequential forward
 * progression (no forward skipping) while allowing backward navigation
 * to previously completed steps.
 *
 * Exports:
 *   - {@link StepContext} — the React context object
 *   - {@link StepProvider} — the context provider component
 *   - {@link useStep} — custom hook for consuming step state
 *
 * @module StepContext
 */

import React, { createContext, useState, useCallback, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { STEP_ORDER } from '../constants/constants.js';

/**
 * @type {React.Context}
 */
export const StepContext = createContext(null);

/**
 * Multi-step flow navigation context provider component.
 *
 * Manages the current step index, completed steps set, and provides
 * navigation actions (goToStep, goNext, goBack) with enforcement of
 * sequential forward progression and backward navigation rules.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components.
 * @param {Array<string>} [props.steps] - Ordered list of step names.
 *   Defaults to {@link STEP_ORDER}.
 * @param {number} [props.initialStep=0] - The initial step index (0-based).
 * @returns {React.ReactElement}
 */
export function StepProvider({ children, steps = STEP_ORDER, initialStep = 0 }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    const safeIndex = Math.max(0, Math.min(Math.floor(initialStep), steps.length - 1));
    return safeIndex;
  });

  const [completedSteps, setCompletedSteps] = useState(() => new Set());

  /**
   * The name of the current step.
   * @type {string}
   */
  const currentStep = steps[currentStepIndex] || steps[0];

  /**
   * Whether backward navigation is possible from the current step.
   * @type {boolean}
   */
  const canGoBack = currentStepIndex > 0;

  /**
   * Whether forward navigation is possible from the current step.
   * Forward navigation requires the current step to be marked as completed.
   * @type {boolean}
   */
  const canGoForward =
    currentStepIndex < steps.length - 1 && completedSteps.has(steps[currentStepIndex]);

  /**
   * Checks whether a specific step has been marked as completed.
   *
   * @param {string} stepName - The step name to check.
   * @returns {boolean} `true` if the step has been completed.
   */
  const isStepCompleted = useCallback(
    (stepName) => {
      if (!stepName || typeof stepName !== 'string') {
        return false;
      }
      return completedSteps.has(stepName);
    },
    [completedSteps]
  );

  /**
   * Marks a step as completed. By default marks the current step.
   *
   * @param {string} [stepName] - The step name to mark as completed.
   *   If omitted, the current step is marked.
   */
  const markStepCompleted = useCallback(
    (stepName) => {
      const target = stepName || currentStep;

      if (!target || typeof target !== 'string') {
        return;
      }

      if (!steps.includes(target)) {
        return;
      }

      setCompletedSteps((prev) => {
        if (prev.has(target)) {
          return prev;
        }
        const next = new Set(prev);
        next.add(target);
        return next;
      });
    },
    [currentStep, steps]
  );

  /**
   * Navigates to a specific step by name or index.
   *
   * Navigation rules:
   *   - Backward navigation is always allowed to any previous step.
   *   - Forward navigation is only allowed to the immediately next step
   *     when the current step is completed. Skipping forward is not permitted.
   *
   * @param {string|number} stepOrIndex - The step name or 0-based index
   *   to navigate to.
   * @returns {boolean} `true` if navigation succeeded.
   */
  const goToStep = useCallback(
    (stepOrIndex) => {
      let targetIndex;

      if (typeof stepOrIndex === 'number') {
        targetIndex = Math.floor(stepOrIndex);
      } else if (typeof stepOrIndex === 'string') {
        targetIndex = steps.indexOf(stepOrIndex);
      } else {
        return false;
      }

      // Validate target index bounds
      if (targetIndex < 0 || targetIndex >= steps.length) {
        return false;
      }

      // Same step — no-op
      if (targetIndex === currentStepIndex) {
        return true;
      }

      // Backward navigation is always allowed
      if (targetIndex < currentStepIndex) {
        setCurrentStepIndex(targetIndex);
        return true;
      }

      // Forward navigation — only allowed one step at a time and only
      // if all intermediate steps (including the current one) are completed.
      for (let i = currentStepIndex; i < targetIndex; i++) {
        if (!completedSteps.has(steps[i])) {
          return false;
        }
      }

      setCurrentStepIndex(targetIndex);
      return true;
    },
    [currentStepIndex, completedSteps, steps]
  );

  /**
   * Advances to the next step if the current step is completed.
   *
   * @returns {boolean} `true` if navigation succeeded.
   */
  const goNext = useCallback(() => {
    if (!canGoForward) {
      return false;
    }

    setCurrentStepIndex((prev) => prev + 1);
    return true;
  }, [canGoForward]);

  /**
   * Navigates back to the previous step.
   *
   * @returns {boolean} `true` if navigation succeeded.
   */
  const goBack = useCallback(() => {
    if (!canGoBack) {
      return false;
    }

    setCurrentStepIndex((prev) => prev - 1);
    return true;
  }, [canGoBack]);

  /**
   * Resets the step flow to the initial state — first step with no
   * completed steps.
   */
  const resetSteps = useCallback(() => {
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());
  }, []);

  const contextValue = useMemo(
    () => ({
      currentStep,
      currentStepIndex,
      steps,
      goToStep,
      goNext,
      goBack,
      canGoForward,
      canGoBack,
      isStepCompleted,
      markStepCompleted,
      resetSteps,
    }),
    [
      currentStep,
      currentStepIndex,
      steps,
      goToStep,
      goNext,
      goBack,
      canGoForward,
      canGoBack,
      isStepCompleted,
      markStepCompleted,
      resetSteps,
    ]
  );

  return (
    <StepContext.Provider value={contextValue}>
      {children}
    </StepContext.Provider>
  );
}

StepProvider.propTypes = {
  children: PropTypes.node.isRequired,
  steps: PropTypes.arrayOf(PropTypes.string),
  initialStep: PropTypes.number,
};

/**
 * Custom hook for consuming the multi-step flow navigation context.
 *
 * Must be used within a {@link StepProvider}. Throws if used outside
 * the provider tree.
 *
 * @returns {{
 *   currentStep: string,
 *   currentStepIndex: number,
 *   steps: Array<string>,
 *   goToStep: function(string|number): boolean,
 *   goNext: function(): boolean,
 *   goBack: function(): boolean,
 *   canGoForward: boolean,
 *   canGoBack: boolean,
 *   isStepCompleted: function(string): boolean,
 *   markStepCompleted: function(string=): void,
 *   resetSteps: function(): void
 * }}
 */
export function useStep() {
  const context = useContext(StepContext);

  if (context === null) {
    throw new Error(
      'useStep must be used within a StepProvider. ' +
      'Wrap your component tree with <StepProvider>.'
    );
  }

  return context;
}