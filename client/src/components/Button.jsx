import React from 'react';

/**
 * Unified Button component.
 * Props:
 *  - variant: primary | secondary | outline | danger | neutral | text
 *  - size: sm | md | lg
 *  - icon: React node placed left
 *  - iconRight: React node placed right
 *  - loading: boolean to show spinner & disable
 */
export default function Button({
  as: Element = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  icon, iconRight,
  loading = false,
  disabled,
  children,
  ...rest
}) {
  const isLink = Element === 'a' || Element === 'link';
  const base = 'btn';
  const classes = [
    base,
    variant !== 'primary' ? variant : '',
    size !== 'md' ? size : '',
    loading ? 'is-loading' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <Element
      className={classes}
      aria-disabled={disabled || loading}
      disabled={!isLink && (disabled || loading) ? true : undefined}
      {...rest}
    >
      {loading && (
        <span className="btn-spinner" aria-hidden="true" />
      )}
      {icon && <span className="btn-icon-left" aria-hidden="true">{icon}</span>}
      <span className="btn-label">{children}</span>
      {iconRight && <span className="btn-icon-right" aria-hidden="true">{iconRight}</span>}
    </Element>
  );
}
