/**
 * AnGear Language Extension - FSRS Test Page
 * UI for running comprehensive FSRS algorithm validation
 */

import React, { useState } from 'react';
import { ArrowLeft, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { FSRSTestValidator, FSRSValidationReport, FSRSTestResult } from '../../shared/utils/fsrsTestValidator';

interface FSRSTestPageProps {
  onBack?: () => void;
}

export const FSRSTestPage: React.FC<FSRSTestPageProps> = ({ onBack }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<FSRSValidationReport | null>(null);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const runValidation = async () => {
    setIsRunning(true);
    setReport(null);
    setProgress(0);
    setCurrentTest('Initializing...');

    try {
      const validator = new FSRSTestValidator();
      
      // Create a progress tracking wrapper
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        const message = args.join(' ');
        if (message.includes('📝 Setting up test data')) {
          setCurrentTest('生成测试数据 (100张卡片)');
          setProgress(10);
        } else if (message.includes('🔄 Testing basic FSRS workflow')) {
          setCurrentTest('测试基本FSRS工作流程');
          setProgress(30);
        } else if (message.includes('⭐ Testing all rating scenarios')) {
          setCurrentTest('测试所有评分场景');
          setProgress(50);
        } else if (message.includes('🔄 Testing FSRS state transitions')) {
          setCurrentTest('测试FSRS状态转换');
          setProgress(70);
        } else if (message.includes('🚀 Testing performance')) {
          setCurrentTest('性能压力测试');
          setProgress(85);
        } else if (message.includes('⚡ Testing rapid review')) {
          setCurrentTest('快速复习测试');
          setProgress(95);
        }
        originalConsoleLog(...args);
      };

      const validationReport = await validator.runCompleteValidation();
      
      console.log = originalConsoleLog;
      setReport(validationReport);
      setProgress(100);
      setCurrentTest('验证完成');

    } catch (error) {
      console.error('FSRS validation error:', error);
      setCurrentTest(`验证失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getTestStatusIcon = (result: FSRSTestResult) => {
    if (result.success) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getOverallStatusColor = () => {
    if (!report) return 'text-gray-600';
    return report.overallSuccess ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-primary-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary-900">FSRS算法验证</h1>
            <p className="text-primary-600 mt-2">
              全面测试FSRS间隔重复算法的功能和性能
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回</span>
            </button>
          )}
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-primary-900 mb-2">
                运行验证测试
              </h2>
              <p className="text-primary-600">
                此测试将生成100张测试卡片并验证FSRS算法的所有功能
              </p>
            </div>
            <button
              onClick={runValidation}
              disabled={isRunning}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                isRunning
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>{isRunning ? '运行中...' : '开始验证'}</span>
            </button>
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-primary-600 mb-2">
                <span>{currentTest}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-primary-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Validation Results */}
        {report && (
          <div className="space-y-6">
            {/* Overall Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-primary-900">
                  验证结果概览
                </h2>
                <div className={`flex items-center space-x-2 font-medium ${getOverallStatusColor()}`}>
                  {report.overallSuccess ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <span>
                    {report.overallSuccess ? '验证通过' : '验证失败'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-900">{report.totalCards}</div>
                  <div className="text-sm text-primary-600">测试卡片</div>
                </div>
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-900">{report.testResults.length}</div>
                  <div className="text-sm text-primary-600">测试项目</div>
                </div>
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <div className={`text-2xl font-bold ${report.overallSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    {report.testResults.filter(t => t.success).length}/{report.testResults.length}
                  </div>
                  <div className="text-sm text-primary-600">通过率</div>
                </div>
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-900">
                    {report.testResults.reduce((sum, t) => sum + t.results.cardsProcessed, 0)}
                  </div>
                  <div className="text-sm text-primary-600">处理卡片</div>
                </div>
              </div>
            </div>

            {/* Validation Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">
                功能验证状态
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-primary-600">FSRS算法工作</span>
                  {report.validationSummary.algorithmsWorking ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-600">状态转换正确</span>
                  {report.validationSummary.stateTransitionsCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-600">间隔计算有效</span>
                  {report.validationSummary.intervalCalculationsValid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-600">性能可接受</span>
                  {report.validationSummary.performanceAcceptable ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Individual Test Results */}
            <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">
                详细测试结果
              </h3>
              <div className="space-y-4">
                {report.testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getTestStatusIcon(result)}
                        <h4 className="font-medium text-primary-900">{result.testName}</h4>
                      </div>
                      <div className="text-sm text-primary-600">
                        {result.performance.reviewTime}ms
                      </div>
                    </div>
                    <p className="text-sm text-primary-600 mb-2">{result.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-primary-500">处理卡片:</span>
                        <span className="ml-1 font-medium">{result.results.cardsProcessed}</span>
                      </div>
                      <div>
                        <span className="text-primary-500">状态转换:</span>
                        <span className="ml-1 font-medium">{result.results.stateTransitions.length}</span>
                      </div>
                      <div>
                        <span className="text-primary-500">平均间隔:</span>
                        <span className="ml-1 font-medium">
                          {result.results.averageInterval > 0 
                            ? `${result.results.averageInterval.toFixed(1)}天` 
                            : 'N/A'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-primary-500">错误数:</span>
                        <span className={`ml-1 font-medium ${result.results.errors.length > 0 ? 'text-red-600' : ''}`}>
                          {result.results.errors.length}
                        </span>
                      </div>
                    </div>

                    {result.results.errors.length > 0 && (
                      <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                        <h5 className="text-sm font-medium text-red-800 mb-1">错误信息:</h5>
                        <div className="text-xs text-red-700 space-y-1">
                          {result.results.errors.slice(0, 3).map((error, i) => (
                            <div key={i}>{error}</div>
                          ))}
                          {result.results.errors.length > 3 && (
                            <div>... 还有 {result.results.errors.length - 3} 个错误</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
                建议和总结
              </h3>
              <div className="space-y-2">
                {report.recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border-l-4 ${
                      recommendation.includes('✅') 
                        ? 'bg-green-50 border-green-400 text-green-800'
                        : recommendation.includes('⚠️') || recommendation.includes('🐛')
                        ? 'bg-amber-50 border-amber-400 text-amber-800'
                        : 'bg-blue-50 border-blue-400 text-blue-800'
                    }`}
                  >
                    {recommendation}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 