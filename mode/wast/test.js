// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function() {
  var mode = CodeMirror.getMode({indentUnit: 4}, "wast");
  function MT(name) {test.mode(name, mode, Array.prototype.slice.call(arguments, 1));}

  MT('number-test',
     '[number 0]',
     '[number 123]',
     '[number nan]',
     '[number inf]',
     '[number infinity]',
     '[number 0.1]',
     '[number 123.0]',
     '[number 12E+99]');

  MT('string-literals-test',
     '[string "foo"]',
     '[string "\\"foo\\""]',
     '[string "foo #\\"# bar"]');

  MT('atom-test',
     '[atom anyfunc]',
     '[atom i32]',
     '[atom i64]',
     '[atom f32]',
     '[atom f64]');

  MT('keyword-test',
     '[keyword br]',
     '[keyword if]',
     '[keyword loop]',
     '[keyword i32.add]',
     '[keyword local.get]');

  MT('control-instructions',
     '[keyword unreachable]',
     '[keyword nop]',
     '[keyword br] [variable-2 $label0]',
     '[keyword br_if] [variable-2 $label0]',
     '[keyword br_table] [variable-2 $label0] [variable-2 $label1] [variable-2 $label3]',
     '[keyword return]',
     '[keyword call] [variable-2 $func0]',
     '[keyword call_indirect] ([keyword param] [atom f32] [atom f64]) ([keyword result] [atom i32] [atom i64])',
     '[keyword return_call] [variable-2 $func0]',
     '[keyword return_call_indirect] ([keyword param] [atom f32] [atom f64]) ([keyword result] [atom i32] [atom i64])');

  MT('memory-instructions',
     '[keyword i32.load] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i32.load8_s] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i32.load8_u] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i32.load16_s] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i32.load16_u] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i32.store] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i32.store8] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i32.store16] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i64.store] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i64.load] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i64.load8_s] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i64.load8_u] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i64.load16_s] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i64.load16_u] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i64.load32_s] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i64.load32_u] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i64.store8] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i64.store16] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword i64.store32] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword f32.load] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword f32.store] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword f64.load] [keyword offset]=[number 4] [keyword align]=[number 4]',
     '[keyword f64.store] [keyword offset]=[number 4] [keyword align]=[number 4]');

  MT('atomic-memory-instructions',
     '[keyword memory.atomic.notify] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword memory.atomic.wait32] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword memory.atomic.wait64] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.load] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.load8_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.load16_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.store] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.store8] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.store16] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.load] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.load8_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.load16_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.load32_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.store] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.store8] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.store16] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.store32] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw.add] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw8.add_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw16.add_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw.add] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw8.add_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw16.add_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw32.add_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw.sub] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw8.sub_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw16.sub_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw.sub] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw8.sub_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw16.sub_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw32.sub_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw.and] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw8.and_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw16.and_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw.and] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw8.and_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw16.and_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw32.and_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw.or] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw8.or_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw16.or_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw.or] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw8.or_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw16.or_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw32.or_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw.xor] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw8.xor_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw16.xor_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw.xor] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw8.xor_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw16.xor_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw32.xor_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw.xchg] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw8.xchg_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw16.xchg_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw.xchg] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw8.xchg_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw16.xchg_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw32.xchg_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw.cmpxchg] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw8.cmpxchg_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i32.atomic.rmw16.cmpxchg_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw.cmpxchg] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw8.cmpxchg_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw16.cmpxchg_u] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword i64.atomic.rmw32.cmpxchg_u] [keyword offset]=[number 32] [keyword align]=[number 4]');

  MT('simd-instructions',
     '[keyword v128.load] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword v128.store] [keyword offset]=[number 32] [keyword align]=[number 4]',
     '[keyword v128.const] [number 0] [number 1] [number 2] [number 3] [number 4] [number 5] [number 6] [number 7] [number 8] [number 9] [number 10] [number 11] [number 12] [number 13] [number 14] [number 15]',
     '[keyword i8x16.splat]',
     '[keyword i16x8.splat]',
     '[keyword i32x4.splat]',
     '[keyword i64x2.splat]',
     '[keyword f32x4.splat]',
     '[keyword f64x2.splat]',
     '[keyword i8x16.extract_lane_s] [number 1]',
     '[keyword i8x16.extract_lane_u] [number 1]',
     '[keyword i8x16.replace_lane] [number 1]',
     '[keyword i16x8.extract_lane_s] [number 1]',
     '[keyword i16x8.extract_lane_u] [number 1]',
     '[keyword i16x8.replace_lane] [number 1]',
     '[keyword i32x4.extract_lane] [number 1]',
     '[keyword i32x4.replace_lane] [number 1]',
     '[keyword i64x2.extract_lane] [number 1]',
     '[keyword i64x2.replace_lane] [number 1]',
     '[keyword f32x4.extract_lane] [number 1]',
     '[keyword f32x4.replace_lane] [number 1]',
     '[keyword f64x2.extract_lane] [number 1]',
     '[keyword f64x2.replace_lane] [number 1]',
     '[keyword v128.not]',
     '[keyword v128.andnot]',
     '[keyword v128.and]',
     '[keyword v128.or]',
     '[keyword v128.xor]',
     '[keyword v128.bitselect]',
     '[keyword i8x16.neg]',
     '[keyword i8x16.shl]',
     '[keyword i8x16.shr_s]',
     '[keyword i8x16.shr_u]',
     '[keyword i8x16.add]',
     '[keyword i8x16.sub]',
     '[keyword i16x8.add]',
     '[keyword i16x8.neg]',
     '[keyword i16x8.shl]',
     '[keyword i16x8.shr_s]',
     '[keyword i16x8.shr_u]',
     '[keyword i16x8.sub]',
     '[keyword i32x4.add]',
     '[keyword i32x4.neg]',
     '[keyword i32x4.shl]',
     '[keyword i32x4.shr_s]',
     '[keyword i32x4.shr_u]',
     '[keyword i32x4.sub]',
     '[keyword i64x2.add]',
     '[keyword i64x2.neg]',
     '[keyword i64x2.shl]',
     '[keyword i64x2.shr_s]',
     '[keyword i64x2.shr_u]',
     '[keyword i64x2.sub]',
  );
})();
