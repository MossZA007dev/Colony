import * as React from 'react';
import { motion, AnimatePresence, type Transition, type HTMLMotionProps } from 'framer-motion';

type TabsContextValue = {
  value: string;
  setValue: (v: string) => void;
  layoutId: string;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('Tabs subcomponents must be used inside <Tabs>.');
  return ctx;
}

export type TabsProps = React.ComponentProps<'div'> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

export function Tabs({ value, defaultValue, onValueChange, children, ...rest }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const current = isControlled ? value! : internal;
  const layoutId = React.useId();

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternal(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value: current, setValue, layoutId }}>
      <div {...rest}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = '', ...rest }: React.ComponentProps<'div'>) {
  return <div role="tablist" className={className} {...rest} />;
}

export type TabsTriggerProps = HTMLMotionProps<'button'> & {
  value: string;
  highlightClassName?: string;
};

export function TabsTrigger({ value, children, className = '', highlightClassName = '', ...rest }: TabsTriggerProps) {
  const { value: active, setValue, layoutId } = useTabsContext();
  const isActive = active === value;
  return (
    <motion.button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      onClick={() => setValue(value)}
      whileTap={{ scale: 0.97 }}
      className={`relative ${className}`}
      {...rest}
    >
      {isActive && (
        <motion.span
          layoutId={`tabs-active-${layoutId}`}
          className={highlightClassName || 'absolute inset-0 -z-10 rounded-[inherit] bg-white/[0.08] ring-1 ring-white/[0.12]'}
          transition={{ type: 'spring', stiffness: 380, damping: 32, bounce: 0 }}
        />
      )}
      {children as React.ReactNode}
    </motion.button>
  );
}

const DEFAULT_CONTENTS_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 32,
  bounce: 0,
  restDelta: 0.01,
};

export type TabsContentsProps = React.ComponentProps<'div'> & {
  transition?: Transition;
};

export function TabsContents({ children, className = '', transition = DEFAULT_CONTENTS_TRANSITION, ...rest }: TabsContentsProps) {
  const { value } = useTabsContext();
  const childArray = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<{ value: string }>[];
  const active = childArray.find((c) => c.props.value === value) ?? null;

  return (
    <motion.div layout className={className} transition={transition} {...(rest as object)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 4, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -4, filter: 'blur(6px)' }}
          transition={transition}
        >
          {active}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export type TabsContentProps = HTMLMotionProps<'div'> & {
  value: string;
};

export function TabsContent({ value: _value, children, ...rest }: TabsContentProps) {
  return <motion.div {...rest}>{children}</motion.div>;
}

export default Tabs;
