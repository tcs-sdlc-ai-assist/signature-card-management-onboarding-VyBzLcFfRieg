/**
 * Multi-step progress indicator component.
 *
 * Renders a horizontal step bar showing the user's current position in
 * the card management workflow. Each step displays a numbered circle,
 * a label, and a connector line between steps. Steps can be in active,
 * completed, or disabled states.
 *
 * Uses HB CSS framework classes for styling:
 *   - `.hb-progress-wrapper` for the outer container
 *   - `.hb-progress-step` for each step item
 *   - `.hb-progress-circle` for the numbered circle
 *   - `.hb-progress-label` for the step label text
 *   - `.hb-progress-connector` for the line between steps
 *
 * Supports keyboard navigation between steps and implements proper
 * ARIA attributes for accessibility.
 *
 * @module ProgressIndicator
 */

import React, { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { STEP_ORDER } from '../../constants/constants.js';

/**
 * Checkmark SVG icon rendered inside completed step circles.
 *
 * @returns {React.ReactElement} An SVG checkmark icon.
 */
function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Determines the state class name for a step.
 *
 * @param {number} stepIndex - The index of the step.
 * @param {number} currentStepIndex - The index of the current active step.
 * @param {Set<string>|Array<string>} completedSteps - The set or array of completed step names.
 * @param {string} stepName - The name of the step.
 * @returns {string} The CSS state class ('active', 'completed', or '').
 */
function getStepState(stepIndex, currentStepIndex, completedSteps, stepName) {
  const completedSet = completedSteps instanceof Set
    ? completedSteps
    : new Set(Array.isArray(completedSteps) ? completedSteps : []);

  if (stepIndex === currentStepIndex) {
    return 'active';
  }

  if (completedSet.has(stepName)) {
    return 'completed';
  }

  return '';
}

/**
 * Determines whether a connector between two steps should be marked as completed.
 *
 * @param {number} connectorIndex - The index of the step before the connector.
 * @param {Set<string>|Array<string>} completedSteps - The set or array of completed step names.
 * @param {Array<string>} steps - The ordered list of step names.
 * @returns {boolean} `true` if the connector should be styled as completed.
 */
function isConnectorCompleted(connectorIndex, completedSteps, steps) {
  const completedSet = completedSteps instanceof Set
    ? completedSteps
    : new Set(Array.isArray(completedSteps) ? completedSteps : []);

  return completedSet.has(steps[connectorIndex]);
}

/**
 * Multi-step progress indicator component.
 *
 * Renders a horizontal step bar with numbered circles, labels, and
 * connector lines. Supports active, completed, and disabled step states.
 * Implements keyboard navigation (left/right arrow keys) and ARIA
 * progressbar semantics for accessibility.
 *
 * @param {Object} props
 * @param {Array<string>} [props.steps] - Ordered list of step names.
 *   Defaults to {@link STEP_ORDER}.
 * @param {number} [props.currentStep=0] - The 0-based index of the
 *   currently active step.
 * @param {Array<string>|Set<string>} [props.completedSteps] - The set
 *   or array of completed step names.
 * @param {function} [props.onStepClick] - Callback invoked when a step
 *   is clicked or activated via keyboard. Receives the step index and
 *   step name: `onStepClick(index, stepName)`.
 * @param {string} [props.className] - Additional CSS class names to apply
 *   to the wrapper element.
 * @returns {React.ReactElement} The rendered progress indicator.
 */
export function ProgressIndicator({
  steps = STEP_ORDER,
  currentStep = 0,
  completedSteps = [],
  onStepClick = null,
  className = '',
}) {
  const stepRefs = useRef([]);

  const safeCurrentStep = Math.max(0, Math.min(Math.floor(currentStep), steps.length - 1));

  const completedSet = completedSteps instanceof Set
    ? completedSteps
    : new Set(Array.isArray(completedSteps) ? completedSteps : []);

  const completedCount = steps.filter((s) => completedSet.has(s)).length;

  /**
   * Calculates the progress percentage for the ARIA progressbar.
   *
   * @returns {number} A value between 0 and 100.
   */
  const progressPercent = steps.length > 1
    ? Math.round((completedCount / steps.length) * 100)
    : 0;

  /**
   * Determines whether a step is clickable (navigable).
   * A step is clickable if it is completed or is the step immediately
   * after the last completed step.
   *
   * @param {number} stepIndex - The index of the step.
   * @param {string} stepName - The name of the step.
   * @returns {boolean} `true` if the step can be navigated to.
   */
  const isStepClickable = useCallback((stepIndex, stepName) => {
    if (typeof onStepClick !== 'function') {
      return false;
    }

    // Current step is always clickable
    if (stepIndex === safeCurrentStep) {
      return true;
    }

    // Completed steps are always clickable (backward navigation)
    if (completedSet.has(stepName)) {
      return true;
    }

    // The step immediately after the current step is clickable if the current step is completed
    if (stepIndex === safeCurrentStep + 1 && completedSet.has(steps[safeCurrentStep])) {
      return true;
    }

    // Backward navigation to any previous step is allowed
    if (stepIndex < safeCurrentStep) {
      return true;
    }

    return false;
  }, [onStepClick, safeCurrentStep, completedSet, steps]);

  /**
   * Handles click on a step.
   *
   * @param {number} stepIndex - The index of the clicked step.
   * @param {string} stepName - The name of the clicked step.
   */
  const handleStepClick = useCallback((stepIndex, stepName) => {
    if (typeof onStepClick !== 'function') {
      return;
    }

    if (!isStepClickable(stepIndex, stepName)) {
      return;
    }

    onStepClick(stepIndex, stepName);
  }, [onStepClick, isStepClickable]);

  /**
   * Handles keyboard navigation within the step list.
   * Supports left/right arrow keys for moving focus, and Enter/Space
   * for activating a step.
   *
   * @param {React.KeyboardEvent} event - The keyboard event.
   * @param {number} stepIndex - The index of the focused step.
   * @param {string} stepName - The name of the focused step.
   */
  const handleKeyDown = useCallback((event, stepIndex, stepName) => {
    let targetIndex = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        targetIndex = stepIndex < steps.length - 1 ? stepIndex + 1 : 0;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        targetIndex = stepIndex > 0 ? stepIndex - 1 : steps.length - 1;
        break;
      case 'Home':
        event.preventDefault();
        targetIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        targetIndex = steps.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleStepClick(stepIndex, stepName);
        return;
      default:
        return;
    }

    if (targetIndex !== null && stepRefs.current[targetIndex]) {
      stepRefs.current[targetIndex].focus();
    }
  }, [steps, handleStepClick]);

  /**
   * Stores a ref to a step element.
   *
   * @param {number} index - The step index.
   * @param {HTMLElement|null} el - The DOM element.
   */
  const setStepRef = useCallback((index, el) => {
    stepRefs.current[index] = el;
  }, []);

  const wrapperClassName = ['hb-progress-wrapper', className].filter(Boolean).join(' ');

  return (
    <div
      className={wrapperClassName}
      role="progressbar"
      aria-valuenow={progressPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Step ${safeCurrentStep + 1} of ${steps.length}: ${steps[safeCurrentStep] || ''}`}
    >
      {steps.map((stepName, index) => {
        const state = getStepState(index, safeCurrentStep, completedSet, stepName);
        const isActive = state === 'active';
        const isCompleted = state === 'completed';
        const clickable = isStepClickable(index, stepName);

        const stepClassName = [
          'hb-progress-step',
          state,
        ].filter(Boolean).join(' ');

        const circleContent = isCompleted
          ? <CheckIcon />
          : index + 1;

        const tabIndex = index === safeCurrentStep ? 0 : -1;

        return (
          <React.Fragment key={stepName}>
            <div
              className={stepClassName}
              ref={(el) => setStepRef(index, el)}
              role="tab"
              aria-selected={isActive ? 'true' : 'false'}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Step ${index + 1}: ${stepName}${isCompleted ? ' (completed)' : ''}${isActive ? ' (current)' : ''}`}
              tabIndex={tabIndex}
              onClick={() => handleStepClick(index, stepName)}
              onKeyDown={(event) => handleKeyDown(event, index, stepName)}
              style={{ cursor: clickable ? 'pointer' : 'default' }}
            >
              <span className="hb-progress-circle">
                {circleContent}
              </span>
              <span className="hb-progress-label">
                {stepName}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={[
                  'hb-progress-connector',
                  isConnectorCompleted(index, completedSet, steps) ? 'completed' : '',
                ].filter(Boolean).join(' ')}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

ProgressIndicator.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.string),
  currentStep: PropTypes.number,
  completedSteps: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.instanceOf(Set),
  ]),
  onStepClick: PropTypes.func,
  className: PropTypes.string,
};

export default ProgressIndicator;