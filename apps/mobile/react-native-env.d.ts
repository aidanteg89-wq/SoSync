import type { ComponentClass } from 'react';

declare module 'react-native' {
  namespace JSX {
    interface Element extends React.JSX.Element {}
  }

  interface NativeMethods {
    context: any;
    setState: any;
    forceUpdate: any;
    render: any;
    props: any;
    state: any;
    refs: any;
  }

  interface FlatList<ItemT = any> {
    context: any;
    setState: any;
    forceUpdate: any;
    render: any;
    props: any;
    state: any;
    refs: any;
  }

  interface SectionList<ItemT = any, SectionT = any> {
    context: any;
    setState: any;
    forceUpdate: any;
    render: any;
    props: any;
    state: any;
    refs: any;
  }

  interface ScrollView {
    context: any;
    setState: any;
    forceUpdate: any;
    render: any;
    props: any;
    state: any;
    refs: any;
  }
}
