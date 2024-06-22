import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {persistor, store} from './src/Redux/Store';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {RootNavigation} from './src/Navigation';
import Loading from './src/Components/UIComp/Loading';

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
