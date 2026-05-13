import { useMemo } from 'react';
import { NitroModules } from 'react-native-nitro-modules';
import { useTensorflowModel } from 'react-native-fast-tflite';

export function usePhoneDetectionModel() {
  const plugin = useTensorflowModel(
    require('../assets/models/ssd_mobilenet_v1_metadata.tflite'),
    []
  );

  const model = plugin.state === 'loaded' ? plugin.model : undefined;

  const boxedModel = useMemo(
    () => (model ? NitroModules.box(model) : undefined),
    [model]
  );

  return {
    boxedModel,
    state: plugin.state,
    error: plugin.state === 'error' ? plugin.error.message : undefined,
  };
}
