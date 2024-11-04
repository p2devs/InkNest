import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {persistor, store} from './src/Redux/Store';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {RootNavigation} from './src/Navigation';
import Loading from './src/Components/UIComp/Loading';

/**
 * The main App component that sets up the root of the application.
 * It includes the GestureHandlerRootView for gesture handling,
 * the Redux Provider for state management, and the PersistGate
 * for persisting the Redux store.
 *
 * @returns {JSX.Element} The root component of the application.
 */
const App = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Provider store={store}>
        <PersistGate loading={<Loading />} persistor={persistor}>
          <RootNavigation />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
