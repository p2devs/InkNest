#import "RCTInkNestNarration.h"
#import <React_RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import "InkNest-Swift.h"

@implementation RCTInkNestNarration {
  InkNestNarrationEngine *_engine;
}

RCT_EXPORT_MODULE(NativeInkNestNarration)

+ (BOOL)requiresMainQueueSetup { return YES; }

- (instancetype)init {
  if (self = [super init]) { _engine = InkNestNarrationEngine.shared; }
  return self;
}

- (void)getCapabilities:(NSString *)language resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [_engine getCapabilities:language completion:^(NSDictionary *result, NSError *error) {
    if (error) { reject(@"narration_capability", error.localizedDescription, error); }
    else { resolve(result); }
  }];
}

- (void)synthesize:(NSString *)text voiceID:(NSString *)voiceID rate:(double)rate resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [_engine synthesize:text voiceID:voiceID rate:rate completion:^(NSDictionary *result, NSError *error) {
    if (error) { reject(@"narration_synthesis", error.localizedDescription, error); }
    else { resolve(result); }
  }];
}

- (void)cancel:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [_engine cancel:^(BOOL cancelled) { resolve(@(cancelled)); }];
}

- (void)clearAudio:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [_engine clearAudio:^(BOOL cleared, NSError *error) {
    if (error) { reject(@"narration_storage", error.localizedDescription, error); }
    else { resolve(@(cleared)); }
  }];
}

- (void)sceneCue:(NSString *)text language:(NSString *)language resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [_engine sceneCue:text language:language completion:^(NSString *cue) { resolve(cue); }];
}

- (void)schedulePreparation:(NSString *)itemsJSON requiresCharging:(BOOL)requiresCharging resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_main_queue(), ^{
    NSError *error = nil;
    [InkNestNarrationPreparation schedule:itemsJSON requiresCharging:requiresCharging error:&error];
    if (error) { reject(@"narration_preparation", error.localizedDescription, error); }
    else { resolve(@YES); }
  });
}

- (void)collectPreparation:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_main_queue(), ^{ resolve([InkNestNarrationPreparation collect]); });
}

- (void)invalidate { [_engine cancel:^(BOOL cancelled) {}]; }

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeInkNestNarrationSpecJSI>(params);
}
@end
